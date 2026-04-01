import { serverDb } from "@/lib/rdb-server";
import { extractRowId, normalizeTags } from "@/lib/rdb-utils";

export interface Skill {
  id: string;
  title: string;
  description: string | null;
  category: string;
  tags: string[];
  tutorial: string | null;
  codeExamples: string | null;
  useCases: string | null;
  likeCount: number;
  viewCount: number;
  author: { id: string; name: string; avatar: string | null };
  createdAt: string;
}

const PAGE_SIZE = 12;
const SKILL_RDB_WARMUP_TTL_MS = 60_000;
let skillRdbWarmupAt = 0;

function getRdbErrorMessage(error: { message: string; raw?: unknown } | null) {
  if (!error) return null;

  const requestId =
    typeof error.raw === "object" && error.raw !== null
      ? ((error.raw as any).request_id ?? (error.raw as any).requestId ?? "")
      : "";

  return requestId
    ? `${error.message} (request: ${requestId})`
    : error.message;
}

function getSkillLoadError(error: { message: string; raw?: unknown } | null) {
  if (!error) return null;

  const code =
    typeof error.raw === "object" && error.raw !== null
      ? String((error.raw as any).code ?? "")
      : "";

  if (code === "SYS_ERR" || error.message === "Internal system error.") {
    return "CloudBase relational database may be waking up or temporarily unavailable. Please retry in a few seconds.";
  }

  return getRdbErrorMessage(error);
}

async function warmupSkillRdb() {
  const now = Date.now();
  if (now - skillRdbWarmupAt < SKILL_RDB_WARMUP_TTL_MS) {
    return;
  }

  const warmup = await serverDb
    .from("skill")
    .select("_id")
    .eq("status", "PUBLISHED")
    .limit(1)
    .execute();

  if (!warmup.error) {
    skillRdbWarmupAt = now;
  }
}

async function fetchAuthorMap(authorIds: string[]) {
  const authorMap: Record<string, { id: string; name: string; avatar: string | null }> = {};

  if (authorIds.length === 0) return authorMap;

  const { data: profiles } = await serverDb
    .from("user_profile")
    .select("cloudbase_uid, name, avatar")
    .in("cloudbase_uid", authorIds);

  for (const p of (profiles as any[]) || []) {
    authorMap[p.cloudbase_uid] = {
      id: p.cloudbase_uid,
      name: p.name,
      avatar: p.avatar,
    };
  }

  return authorMap;
}

export async function fetchSkills(params: {
  page: number;
  category: string;
  tag: string;
  search: string;
}): Promise<{ skills: Skill[]; totalPages: number; loadError: string | null }> {
  const { page, category, tag, search } = params;

  try {
    await warmupSkillRdb();

    let countQuery = serverDb
      .from("skill")
      .select("_id", { count: "exact" })
      .eq("status", "PUBLISHED");
    let dataQuery = serverDb.from("skill").select("*").eq("status", "PUBLISHED");

    if (category) {
      countQuery = countQuery.eq("category", category);
      dataQuery = dataQuery.eq("category", category);
    }
    if (tag) {
      countQuery = countQuery.contains("tags", [tag]);
      dataQuery = dataQuery.contains("tags", [tag]);
    }
    if (search) {
      countQuery = countQuery.ilike("title", `%${search}%`);
      dataQuery = dataQuery.ilike("title", `%${search}%`);
    }

    const [countResponse, skillResponse] = await Promise.all([
      countQuery,
      dataQuery
        .order("created_at", { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    ]);

    if (countResponse.error || skillResponse.error) {
      const loadError =
        getSkillLoadError(skillResponse.error) ||
        getSkillLoadError(countResponse.error) ||
        "CloudBase request failed.";

      console.error("Failed to fetch skills:", {
        countError: countResponse.error,
        skillError: skillResponse.error,
      });

      return { skills: [], totalPages: 1, loadError };
    }

    const total = countResponse.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const skillRows = (skillResponse.data as any[]) || [];
    const authorIds = Array.from(
      new Set(skillRows.map((skill) => String(skill.author_id))),
    );
    const authorMap = await fetchAuthorMap(authorIds);

    const skills = skillRows
      .map((skill) => {
        const id = extractRowId(skill);
        if (!id) return null;

        return {
          id,
          title: skill.title,
          description: skill.description,
          category: skill.category,
          tags: normalizeTags(skill.tags),
          tutorial: skill.tutorial,
          codeExamples: skill.code_examples,
          useCases: skill.use_cases,
          likeCount: skill.like_count ?? 0,
          viewCount: skill.view_count ?? 0,
          author:
            authorMap[skill.author_id] ?? {
              id: skill.author_id,
              name: "Public Resource",
              avatar: null,
            },
          createdAt: skill.created_at,
        };
      })
      .filter(Boolean) as Skill[];

    return { skills, totalPages, loadError: null };
  } catch (error) {
    console.error("Failed to fetch skills:", error);
    return {
      skills: [],
      totalPages: 1,
      loadError: error instanceof Error ? error.message : "CloudBase request failed.",
    };
  }
}

export async function fetchFeaturedSkills(): Promise<Skill[]> {
  try {
    await warmupSkillRdb();

    const { data, error } = await serverDb
      .from("skill")
      .select("*")
      .eq("status", "PUBLISHED")
      .order("like_count", { ascending: false })
      .range(0, 4);

    if (error || !data) return [];

    const rows = data as any[];
    const authorIds = Array.from(new Set(rows.map((r) => String(r.author_id))));
    const authorMap = await fetchAuthorMap(authorIds);

    return rows
      .map((row) => {
        const id = extractRowId(row);
        if (!id) return null;
        return {
          id,
          title: row.title,
          description: row.description,
          category: row.category,
          tags: normalizeTags(row.tags),
          tutorial: row.tutorial,
          codeExamples: row.code_examples,
          useCases: row.use_cases,
          likeCount: row.like_count ?? 0,
          viewCount: row.view_count ?? 0,
          author:
            authorMap[row.author_id] ?? {
              id: row.author_id,
              name: "Public Resource",
              avatar: null,
            },
          createdAt: row.created_at,
        };
      })
      .filter(Boolean) as Skill[];
  } catch (error) {
    console.error("Failed to fetch featured skills:", error);
    return [];
  }
}

export async function fetchSkillById(id: string): Promise<Skill | null> {
  try {
    await warmupSkillRdb();

    const { data, error } = await serverDb
      .from("skill")
      .select("*")
      .eq("_id", id)
      .single();

    if (error || !data) return null;

    const row = data as any;
    const authorMap = await fetchAuthorMap([row.author_id]);

    return {
      id: extractRowId(row) ?? id,
      title: row.title,
      description: row.description,
      category: row.category,
      tags: normalizeTags(row.tags),
      tutorial: row.tutorial,
      codeExamples: row.code_examples,
      useCases: row.use_cases,
      likeCount: row.like_count ?? 0,
      viewCount: row.view_count ?? 0,
      author:
        authorMap[row.author_id] ?? {
          id: row.author_id,
          name: "Public Resource",
          avatar: null,
        },
      createdAt: row.created_at,
    };
  } catch (error) {
    console.error("Failed to fetch skill:", error);
    return null;
  }
}

export async function fetchRelatedSkills(
  id: string,
  category: string,
): Promise<Skill[]> {
  try {
    await warmupSkillRdb();

    // First try same category
    const { data, error } = await serverDb
      .from("skill")
      .select("*")
      .eq("status", "PUBLISHED")
      .eq("category", category)
      .neq("_id", id)
      .order("like_count", { ascending: false })
      .limit(3);

    if (error || !data || data.length < 3) {
      // Fallback: get any skills if not enough in same category
      const { data: fallbackData } = await serverDb
        .from("skill")
        .select("*")
        .eq("status", "PUBLISHED")
        .neq("_id", id)
        .order("like_count", { ascending: false })
        .limit(3);

      if (!fallbackData) return [];

      const rows = fallbackData as any[];
      const authorIds = Array.from(new Set(rows.map((r) => String(r.author_id))));
      const authorMap = await fetchAuthorMap(authorIds);

      return rows
        .map((row) => {
          const skillId = extractRowId(row);
          if (!skillId) return null;
          return {
            id: skillId,
            title: row.title,
            description: row.description,
            category: row.category,
            tags: normalizeTags(row.tags),
            tutorial: row.tutorial,
            codeExamples: row.code_examples,
            useCases: row.use_cases,
            likeCount: row.like_count ?? 0,
            viewCount: row.view_count ?? 0,
            author:
              authorMap[row.author_id] ?? {
                id: row.author_id,
                name: "Public Resource",
                avatar: null,
              },
            createdAt: row.created_at,
          };
        })
        .filter(Boolean) as Skill[];
    }

    const rows = data as any[];
    const authorIds = Array.from(new Set(rows.map((r) => String(r.author_id))));
    const authorMap = await fetchAuthorMap(authorIds);

    return rows
      .map((row) => {
        const skillId = extractRowId(row);
        if (!skillId) return null;
        return {
          id: skillId,
          title: row.title,
          description: row.description,
          category: row.category,
          tags: normalizeTags(row.tags),
          tutorial: row.tutorial,
          codeExamples: row.code_examples,
          useCases: row.use_cases,
          likeCount: row.like_count ?? 0,
          viewCount: row.view_count ?? 0,
          author:
            authorMap[row.author_id] ?? {
              id: row.author_id,
              name: "Public Resource",
              avatar: null,
            },
          createdAt: row.created_at,
        };
      })
      .filter(Boolean) as Skill[];
  } catch (error) {
    console.error("Failed to fetch related skills:", error);
    return [];
  }
}

export async function fetchSkillCategories(): Promise<string[]> {
  try {
    await warmupSkillRdb();

    const { data, error } = await serverDb
      .from("skill")
      .select("category")
      .eq("status", "PUBLISHED");

    if (error || !data) return [];

    const categories = new Set(
      (data as any[]).map((row) => row.category).filter(Boolean),
    );
    return Array.from(categories).sort();
  } catch (error) {
    console.error("Failed to fetch skill categories:", error);
    return [];
  }
}

export async function fetchSkillTags(): Promise<string[]> {
  try {
    await warmupSkillRdb();

    const { data, error } = await serverDb
      .from("skill")
      .select("tags")
      .eq("status", "PUBLISHED");

    if (error || !data) return [];

    const tags = new Set<string>();
    for (const row of data as any[]) {
      const rowTags = normalizeTags(row.tags);
      for (const tag of rowTags) {
        if (tag) tags.add(tag);
      }
    }
    return Array.from(tags).sort();
  } catch (error) {
    console.error("Failed to fetch skill tags:", error);
    return [];
  }
}