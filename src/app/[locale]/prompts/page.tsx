import { Suspense } from "react";
import PageShell from "@/components/layout/PageShell";
import PromptActiveFilters, { PromptSidebarFilters } from "@/components/prompts/PromptFilters";
import PromptShowcaseCard from "@/components/prompts/PromptShowcaseCard";
import Pagination from "@/components/shared/Pagination";
import Reveal from "@/components/shared/Reveal";
import { applyFullTextSearch } from "@/lib/fullTextSearch";
import { serverDb } from "@/lib/rdb-server";
import { extractRowId, normalizeTags } from "@/lib/rdb-utils";
import { PromptSearchBar } from "@/components/prompts/PromptLayoutFilters";

const i18n = {
  zh: {
    label: "Prompt 库",
    title: "精选学术研究 Prompt",
    subtitle: "浏览可复用的工作流系统，覆盖文献综述、数据分析、论文写作与同行评审。",
    share: "分享你的 Prompt",
    shareDesc: "将你的工作流发布到社区。",
    cardAuthor: "作者",
    cardCode: "代码块",
    cardPreview: "预览",
    cardFeatured: "精选",
    cardPrompt: "Prompt",
    cardCopy: "\u590d\u5236",
    cardCopied: "\u5df2\u590d\u5236",
    noResults: "未找到相关 Prompt",
    noResultsHint: "试试其他分类、清除筛选条件，或使用更宽泛的搜索词。",
  },
  en: {
    label: "Prompt Library",
    title: "Curated Research Prompts",
    subtitle: "Browse reusable workflow systems for literature review, data analysis, paper writing, and peer review.",
    share: "Share Your Prompt",
    shareDesc: "Publish your workflow to the community.",
    cardAuthor: "Author",
    cardCode: "Code Block",
    cardPreview: "Preview",
    cardFeatured: "Featured",
    cardPrompt: "Prompt",
    cardCopy: "Copy",
    cardCopied: "Copied",
    noResults: "No prompts found",
    noResultsHint: "Try a different category, clear your filters, or search with broader terms.",
  },
} as const;

const PAGE_SIZE = 12;
const PROMPT_RDB_WARMUP_TTL_MS = 60_000;
let promptRdbWarmupAt = 0;

const PROMPT_FULL_TEXT_COLUMNS = [
  "title",
  "description",
  "category",
  "tags",
  "content",
];

function PageHero({ title, subtitle }: { label: string; title: string; subtitle: string }) {
  return (
    <div className="mb-6 pt-2 pb-2">
      <h1 className="text-4xl font-bold tracking-tight text-[var(--color-text-primary)] md:text-5xl leading-[1.1]">
        {title}
      </h1>
      <p className="mt-3 text-base leading-[1.5] text-[var(--color-text-secondary)] font-normal max-w-xl">
        {subtitle}
      </p>
    </div>
  );
}

interface Prompt {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  category: string;
  subcategory: string | null;
  tags: string[];
  likeCount: number;
  viewCount: number;
  downloadCount: number;
  authorId: string;
  createdAt: string;
  author: { id: string; name: string; avatar: string | null };
}

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

function getPromptLoadError(error: { message: string; raw?: unknown } | null) {
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

async function warmupPromptRdb() {
  const now = Date.now();
  if (now - promptRdbWarmupAt < PROMPT_RDB_WARMUP_TTL_MS) {
    return;
  }

  const warmup = await serverDb
    .from("prompt")
    .select("_id")
    .eq("status", "PUBLISHED")
    .limit(1)
    .execute();

  if (!warmup.error) {
    promptRdbWarmupAt = now;
  }
}

async function fetchPrompts(params: {
  page: number;
  category: string;
  subcategory: string;
  tag: string;
  search: string;
}): Promise<{ prompts: Prompt[]; totalPages: number; loadError: string | null }> {
  const { page, category, subcategory, tag, search } = params;

  try {
    await warmupPromptRdb();

    let countQuery = serverDb
      .from("prompt")
      .select("_id", { count: "exact" })
      .eq("status", "PUBLISHED");
    let dataQuery = serverDb.from("prompt").select("*").eq("status", "PUBLISHED");

    if (category) {
      countQuery = countQuery.eq("category", category);
      dataQuery = dataQuery.eq("category", category);
    }
    if (subcategory) {
      countQuery = countQuery.eq("subcategory", subcategory);
      dataQuery = dataQuery.eq("subcategory", subcategory);
    }
    if (tag) {
      countQuery = countQuery.contains("tags", [tag]);
      dataQuery = dataQuery.contains("tags", [tag]);
    }
    if (search) {
      countQuery = applyFullTextSearch(countQuery, search, PROMPT_FULL_TEXT_COLUMNS);
      dataQuery = applyFullTextSearch(dataQuery, search, PROMPT_FULL_TEXT_COLUMNS);
    }

    const [countResponse, promptResponse] = await Promise.all([
      countQuery,
      dataQuery
        .order("like_count", { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    ]);

    if (countResponse.error || promptResponse.error) {
      const loadError =
        getPromptLoadError(promptResponse.error) ||
        getPromptLoadError(countResponse.error) ||
        "CloudBase request failed.";

      console.error("Failed to fetch prompts:", {
        countError: countResponse.error,
        promptError: promptResponse.error,
      });

      return { prompts: [], totalPages: 1, loadError };
    }

    const total = countResponse.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const promptRows = (promptResponse.data as any[]) || [];
    const authorIds = Array.from(
      new Set(promptRows.map((prompt) => String(prompt.author_id))),
    );
    const authorMap: Record<string, { id: string; name: string; avatar: string | null }> = {};

    if (authorIds.length > 0) {
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
    }

    const prompts = promptRows
      .map((prompt) => {
        const id = extractRowId(prompt);
        if (!id) return null;

        return {
          id,
          title: prompt.title,
          description: prompt.description,
          content: prompt.content,
          category: prompt.category,
          subcategory: prompt.subcategory ?? null,
          tags: normalizeTags(prompt.tags),
          likeCount: prompt.like_count ?? 0,
          viewCount: prompt.view_count ?? 0,
          downloadCount: prompt.download_count ?? 0,
          authorId: prompt.author_id,
          createdAt: prompt.created_at,
          author:
            authorMap[prompt.author_id] ?? {
              id: prompt.author_id,
              name: "Unknown",
              avatar: null,
            },
        };
      })
      .filter(Boolean) as Prompt[];

    return { prompts, totalPages, loadError: null };
  } catch (error) {
    console.error("Failed to fetch prompts:", error);
    return {
      prompts: [],
      totalPages: 1,
      loadError: error instanceof Error ? error.message : "CloudBase request failed.",
    };
  }
}

async function fetchPromptSubcategories(): Promise<Record<string, string[]>> {
  try {
    await warmupPromptRdb();

    const { data, error } = await serverDb
      .from("prompt")
      .select("category, subcategory")
      .eq("status", "PUBLISHED")
      .execute();

    if (error || !data) return {};

    const result: Record<string, Set<string>> = {};
    for (const row of data as Array<{ category?: string | null; subcategory?: string | null }>) {
      const cat = row.category?.trim();
      const sub = row.subcategory?.trim();
      if (!cat || !sub) continue;
      if (!result[cat]) result[cat] = new Set();
      result[cat].add(sub);
    }

    const record: Record<string, string[]> = {};
    for (const [cat, subs] of Object.entries(result)) {
      record[cat] = Array.from(subs).sort();
    }
    return record;
  } catch (error) {
    console.error("Failed to fetch prompt subcategories:", error);
    return {};
  }
}

async function fetchPromptCategories(locale: string): Promise<string[]> {
  try {
    await warmupPromptRdb();

    const { data, error } = await serverDb
      .from("prompt")
      .select("category")
      .eq("status", "PUBLISHED");

    if (error || !data) {
      return [];
    }

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
    console.error("Failed to fetch prompt categories:", error);
    return [];
  }
}

export default async function PromptsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const t = locale === "en" ? i18n.en : i18n.zh;
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const category = (typeof sp.category === "string" ? sp.category : "") || "";
  const subcategory = (typeof sp.subcategory === "string" ? sp.subcategory : "") || "";
  const tag = (typeof sp.tag === "string" ? sp.tag : "") || "";
  const search = (typeof sp.search === "string" ? sp.search : "") || "";

  const [
    { prompts, totalPages, loadError },
    categories,
    subcategoryMap,
  ] = await Promise.all([
    fetchPrompts({ page, category, subcategory, tag, search }),
    fetchPromptCategories(locale),
    fetchPromptSubcategories(),
  ]);

  // Build queryString for pagination
  const qsParts: string[] = [];
  if (category) qsParts.push(`category=${encodeURIComponent(category)}`);
  if (subcategory) qsParts.push(`subcategory=${encodeURIComponent(subcategory)}`);
  if (tag) qsParts.push(`tag=${encodeURIComponent(tag)}`);
  if (search) qsParts.push(`search=${encodeURIComponent(search)}`);
  const queryString = qsParts.join("&");

  return (
    <PageShell width="6xl">
      <PageHero
        label={t.label}
        title={t.title}
        subtitle={t.subtitle}
      />

      {/* Search Bar - Replaces Featured Carousel */}
      <div className="mb-8">
        <Reveal delay={0} threshold={0.12}>
          <PromptSearchBar />
        </Reveal>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 mt-12">
        <div className="w-full lg:w-64 shrink-0">
          <Suspense>
            <PromptSidebarFilters
              categories={categories}
              availableSubcategories={subcategoryMap}
            />
          </Suspense>
        </div>

        <div className="flex-1 min-w-0">
          <Suspense>
            <PromptActiveFilters />
          </Suspense>

          {prompts.length > 0 ? (
            <div className="flex flex-col gap-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {prompts.map((prompt) => (
                  <PromptShowcaseCard
                    key={prompt.id}
                    prompt={prompt}
                    isFeatured={false}
                    labels={{
                      author: t.cardAuthor,
                      code: t.cardCode,
                      preview: t.cardPreview,
                      featured: t.cardFeatured,
                      prompt: t.cardPrompt,
                      copy: t.cardCopy,
                      copied: t.cardCopied,
                    }}
                  />
                ))}
              </div>
            </div>
          ) : loadError ? (
            <div className="mt-16 text-center">
              <p className="text-sm text-[var(--color-text-secondary)]">
                {locale === "en"
                  ? "Service temporarily unavailable due to network instability. Please wait a few minutes and try again."
                  : "由于网络波动，服务暂不可用，请等待几分钟后重试"}
              </p>
            </div>
          ) : (
            <div className="mt-16 text-center">
              <p className="text-lg font-medium text-[var(--color-text-primary)]">
                {t.noResults}
              </p>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                {t.noResultsHint}
              </p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                basePath="/prompts"
                queryString={queryString}
              />
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
