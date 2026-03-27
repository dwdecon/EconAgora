import { Suspense } from "react";
import { Link } from "@/i18n/navigation";
import { Plus } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import FeaturedCarousel from "@/components/prompts/FeaturedCarousel";
import PromptFilters from "@/components/prompts/PromptFilters";
import PromptShowcaseCard from "@/components/prompts/PromptShowcaseCard";
import Pagination from "@/components/shared/Pagination";
import Reveal from "@/components/shared/Reveal";
import { serverDb } from "@/lib/rdb-server";
import { extractRowId, normalizeTags } from "@/lib/rdb-utils";

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

function PageHero({ label, title, subtitle }: { label: string; title: string; subtitle: string }) {
  return (
    <div className="mx-auto mb-8 max-w-2xl relative text-center">
      <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-b from-primary/5 to-transparent blur-xl" />
      <p className="text-sm font-medium text-[var(--color-text-secondary)]">
        {label}
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[var(--color-text-primary)] md:text-5xl">
        {title}
      </h1>
      <p className="mt-4 text-base leading-relaxed text-[var(--color-text-secondary)]">
        {subtitle}
      </p>
    </div>
  );
}

const CreateNewCard = ({ t }: { t: { share: string; shareDesc: string } }) => (
  <Link
    href="/prompts/new"
    className="group flex min-h-[300px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[var(--color-border)] p-6 text-center transition-colors hover:border-primary/50 hover:bg-[var(--color-bg-surface)]"
  >
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
      <Plus className="h-6 w-6" />
    </div>
    <h3 className="text-lg font-medium text-[var(--color-text-primary)]">{t.share}</h3>
    <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
      {t.shareDesc}
    </p>
  </Link>
);

interface Prompt {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  category: string;
  tags: string[];
  likeCount: number;
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

async function fetchPrompts(params: {
  page: number;
  category: string;
  tag: string;
  search: string;
}): Promise<{ prompts: Prompt[]; totalPages: number; loadError: string | null }> {
  const { page, category, tag, search } = params;

  try {
    let countQuery = serverDb
      .from("prompt")
      .select("_id", { count: "exact" })
      .eq("status", "PUBLISHED");
    let dataQuery = serverDb.from("prompt").select("*").eq("status", "PUBLISHED");

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

    const [countResponse, promptResponse] = await Promise.all([
      countQuery,
      dataQuery
        .order("created_at", { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    ]);

    if (countResponse.error || promptResponse.error) {
      const loadError =
        getRdbErrorMessage(promptResponse.error) ||
        getRdbErrorMessage(countResponse.error) ||
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
          tags: normalizeTags(prompt.tags),
          likeCount: prompt.like_count ?? 0,
          downloadCount: prompt.download_count ?? 0,
          authorId: prompt.author_id,
          createdAt: prompt.created_at,
          author:
            authorMap[prompt.author_id] ?? {
              id: prompt.author_id,
              name: "Unknown user",
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

async function fetchFeatured(): Promise<Prompt[]> {
  try {
    const { data, error } = await serverDb
      .from("prompt")
      .select("*")
      .eq("status", "PUBLISHED")
      .order("like_count", { ascending: false })
      .range(0, 4);

    if (error || !data) return [];

    const rows = data as any[];
    const authorIds = Array.from(new Set(rows.map((r) => String(r.author_id))));
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

    return rows
      .map((row) => {
        const id = extractRowId(row);
        if (!id) return null;
        return {
          id,
          title: row.title,
          description: row.description,
          content: row.content,
          category: row.category,
          tags: normalizeTags(row.tags),
          likeCount: row.like_count ?? 0,
          downloadCount: row.download_count ?? 0,
          authorId: row.author_id,
          createdAt: row.created_at,
          author:
            authorMap[row.author_id] ?? {
              id: row.author_id,
              name: "Unknown user",
              avatar: null,
            },
        };
      })
      .filter(Boolean) as Prompt[];
  } catch (error) {
    console.error("Failed to fetch featured prompts:", error);
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
  const tag = (typeof sp.tag === "string" ? sp.tag : "") || "";
  const search = (typeof sp.search === "string" ? sp.search : "") || "";

  const [{ prompts, totalPages, loadError }, featured] = await Promise.all([
    fetchPrompts({ page, category, tag, search }),
    page === 1 ? fetchFeatured() : Promise.resolve([]),
  ]);

  // Build queryString for pagination
  const qsParts: string[] = [];
  if (category) qsParts.push(`category=${encodeURIComponent(category)}`);
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

      {/* Featured Carousel: page 1 only, above filters */}
      {page === 1 && featured.length > 0 && (
        <div className="mt-10">
          <Reveal delay={0} threshold={0.12}>
            <FeaturedCarousel
              prompts={featured}
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
          </Reveal>
        </div>
      )}

      {/* Filters — below carousel */}
      <div className="mt-8">
        <Suspense>
          <PromptFilters />
        </Suspense>
      </div>

      {/* Grid */}
      {prompts.length > 0 ? (
        <div className="mt-8 flex flex-col gap-8">
          {/* Grid for all paginated prompts */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {page === 1 && (
              <Reveal delay={70} threshold={0.12}>
                <CreateNewCard t={t} />
              </Reveal>
            )}
            {prompts.map((prompt, index) => (
              <Reveal
                key={prompt.id}
                delay={Math.min((index + (page === 1 ? 2 : 1)) * 70, 280)}
                threshold={0.12}
              >
                <PromptShowcaseCard
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
              </Reveal>
            ))}
          </div>
        </div>
      ) : loadError ? (
        <div className="mt-16 text-center">
          <p className="text-lg font-medium text-[var(--color-text-primary)]">
            {locale === "en" ? "Prompt library is temporarily unavailable" : "Prompt 列表暂时无法加载"}
          </p>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            {locale === "en"
              ? `CloudBase returned: ${loadError}`
              : `CloudBase 返回错误：${loadError}`}
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

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        basePath="/prompts"
        queryString={queryString}
      />
    </PageShell>
  );
}
