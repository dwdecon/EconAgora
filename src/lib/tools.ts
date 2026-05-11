import { cache } from "react";
import { unstable_cache } from "next/cache";
import { serverDb } from "@/lib/rdb-server";
import { applyFullTextSearch } from "@/lib/fullTextSearch";
import { extractRowId, normalizeTags } from "@/lib/rdb-utils";

export interface Tool {
  id: string;
  title: string;
  description: string | null;
  category: string;
  tags: string[];
  officialUrl: string | null;
  docsUrl: string | null;
  quickStart: string | null;
  integrationGuide: string | null;
  likeCount: number;
  viewCount: number;
  author: { id: string; name: string; avatar: string | null };
  createdAt: string;
}

const PAGE_SIZE = 12;
const TOOL_RDB_WARMUP_TTL_MS = 60_000;
let toolRdbWarmupAt = 0;

const TOOL_FULL_TEXT_COLUMNS = [
  "title",
  "description",
  "category",
  "tags",
  "quick_start",
  "integration_guide",
  "official_url",
  "docs_url",
];

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

function getToolLoadError(error: { message: string; raw?: unknown } | null) {
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

async function warmupToolRdb() {
  const now = Date.now();
  if (now - toolRdbWarmupAt < TOOL_RDB_WARMUP_TTL_MS) {
    return;
  }

  const warmup = await serverDb
    .from("tool")
    .select("_id")
    .eq("status", "PUBLISHED")
    .limit(1)
    .execute();

  if (!warmup.error) {
    toolRdbWarmupAt = now;
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

export async function fetchTools(params: {
  page: number;
  category: string;
  tag: string;
  search: string;
}): Promise<{ tools: Tool[]; totalPages: number; loadError: string | null }> {
  const { page, category, tag, search } = params;

  try {
    await warmupToolRdb();

    let countQuery = serverDb
      .from("tool")
      .select("_id", { count: "exact" })
      .eq("status", "PUBLISHED");
    let dataQuery = serverDb.from("tool").select("*").eq("status", "PUBLISHED");

    if (category) {
      countQuery = countQuery.eq("category", category);
      dataQuery = dataQuery.eq("category", category);
    }
    if (tag) {
      countQuery = countQuery.contains("tags", [tag]);
      dataQuery = dataQuery.contains("tags", [tag]);
    }
    if (search) {
      countQuery = applyFullTextSearch(countQuery, search, TOOL_FULL_TEXT_COLUMNS);
      dataQuery = applyFullTextSearch(dataQuery, search, TOOL_FULL_TEXT_COLUMNS);
    }

    const [countResponse, toolResponse] = await Promise.all([
      countQuery,
      dataQuery
        .order("created_at", { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    ]);

    if (countResponse.error || toolResponse.error) {
      const loadError =
        getToolLoadError(toolResponse.error) ||
        getToolLoadError(countResponse.error) ||
        "CloudBase request failed.";

      console.error("Failed to fetch tools:", {
        countError: countResponse.error,
        toolError: toolResponse.error,
      });

      return { tools: [], totalPages: 1, loadError };
    }

    const total = countResponse.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const toolRows = (toolResponse.data as any[]) || [];
    const authorIds = Array.from(
      new Set(toolRows.map((tool) => String(tool.author_id))),
    );
    const authorMap = await fetchAuthorMap(authorIds);

    const tools = toolRows
      .map((tool) => {
        const id = extractRowId(tool);
        if (!id) return null;

        return {
          id,
          title: tool.title,
          description: tool.description,
          category: tool.category,
          tags: normalizeTags(tool.tags),
          officialUrl: tool.official_url,
          docsUrl: tool.docs_url,
          quickStart: tool.quick_start,
          integrationGuide: tool.integration_guide,
          likeCount: tool.like_count ?? 0,
          viewCount: tool.view_count ?? 0,
          author:
            authorMap[tool.author_id] ?? {
              id: tool.author_id,
              name: "Unknown",
              avatar: null,
            },
          createdAt: tool.created_at,
        };
      })
      .filter(Boolean) as Tool[];

    return { tools, totalPages, loadError: null };
  } catch (error) {
    console.error("Failed to fetch tools:", error);
    return {
      tools: [],
      totalPages: 1,
      loadError: error instanceof Error ? error.message : "CloudBase request failed.",
    };
  }
}

async function _fetchFeaturedTools(): Promise<Tool[]> {
  try {
    await warmupToolRdb();

    const { data, error } = await serverDb
      .from("tool")
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
          officialUrl: row.official_url,
          docsUrl: row.docs_url,
          quickStart: row.quick_start,
          integrationGuide: row.integration_guide,
          likeCount: row.like_count ?? 0,
          viewCount: row.view_count ?? 0,
          author:
            authorMap[row.author_id] ?? {
              id: row.author_id,
              name: "Unknown",
              avatar: null,
            },
          createdAt: row.created_at,
        };
      })
      .filter(Boolean) as Tool[];
  } catch (error) {
    console.error("Failed to fetch featured tools:", error);
    return [];
  }
}

export const fetchFeaturedTools = cache(
  unstable_cache(_fetchFeaturedTools, ["featured-tools"], {
    revalidate: 60,
  })
);

export async function fetchToolById(id: string): Promise<Tool | null> {
  try {
    await warmupToolRdb();

    const { data, error } = await serverDb
      .from("tool")
      .select("*")
      .eq("_id", id)
      .eq("status", "PUBLISHED")
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
      officialUrl: row.official_url,
      docsUrl: row.docs_url,
      quickStart: row.quick_start,
      integrationGuide: row.integration_guide,
      likeCount: row.like_count ?? 0,
      viewCount: row.view_count ?? 0,
      author:
        authorMap[row.author_id] ?? {
          id: row.author_id,
          name: "Unknown",
          avatar: null,
        },
      createdAt: row.created_at,
    };
  } catch (error) {
    console.error("Failed to fetch tool:", error);
    return null;
  }
}

export async function fetchRelatedTools(
  id: string,
  category: string,
): Promise<Tool[]> {
  try {
    await warmupToolRdb();

    const { data, error } = await serverDb
      .from("tool")
      .select("*")
      .eq("status", "PUBLISHED")
      .eq("category", category)
      .neq("_id", id)
      .order("like_count", { ascending: false })
      .limit(3);

    if (error || !data || data.length < 3) {
      const { data: fallbackData } = await serverDb
        .from("tool")
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
          const toolId = extractRowId(row);
          if (!toolId) return null;
          return {
            id: toolId,
            title: row.title,
            description: row.description,
            category: row.category,
            tags: normalizeTags(row.tags),
            officialUrl: row.official_url,
            docsUrl: row.docs_url,
            quickStart: row.quick_start,
            integrationGuide: row.integration_guide,
            likeCount: row.like_count ?? 0,
            viewCount: row.view_count ?? 0,
            author:
              authorMap[row.author_id] ?? {
                id: row.author_id,
                name: "Unknown",
                avatar: null,
              },
            createdAt: row.created_at,
          };
        })
        .filter(Boolean) as Tool[];
    }

    const rows = data as any[];
    const authorIds = Array.from(new Set(rows.map((r) => String(r.author_id))));
    const authorMap = await fetchAuthorMap(authorIds);

    return rows
      .map((row) => {
        const toolId = extractRowId(row);
        if (!toolId) return null;
        return {
          id: toolId,
          title: row.title,
          description: row.description,
          category: row.category,
          tags: normalizeTags(row.tags),
          officialUrl: row.official_url,
          docsUrl: row.docs_url,
          quickStart: row.quick_start,
          integrationGuide: row.integration_guide,
          likeCount: row.like_count ?? 0,
          viewCount: row.view_count ?? 0,
          author:
            authorMap[row.author_id] ?? {
              id: row.author_id,
              name: "Unknown",
              avatar: null,
            },
          createdAt: row.created_at,
        };
      })
      .filter(Boolean) as Tool[];
  } catch (error) {
    console.error("Failed to fetch related tools:", error);
    return [];
  }
}

export async function fetchToolCategories(locale = "en"): Promise<string[]> {
  try {
    await warmupToolRdb();

    const { data, error } = await serverDb
      .from("tool")
      .select("category")
      .eq("status", "PUBLISHED");

    if (error || !data) return [];

    const categories = Array.from(
      new Set(
        (data as Array<{ category?: string | null }>)
          .map((row) => row.category?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    );

    return categories.sort((left, right) =>
      left.localeCompare(right, locale === "en" ? "en" : "zh-CN"),
    );
  } catch (error) {
    console.error("Failed to fetch tool categories:", error);
    return [];
  }
}
