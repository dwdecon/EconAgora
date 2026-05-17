import PageShell from "@/components/layout/PageShell";
import ToolActiveFilters, {
  ToolSearchBar,
  ToolSidebarFilters,
} from "@/components/tools/ToolFilters";
import ToolCard from "@/components/tools/ToolCard";
import Pagination from "@/components/shared/Pagination";
import Reveal from "@/components/shared/Reveal";
import { fetchToolCategories, fetchTools } from "@/lib/tools";

const i18n = {
  zh: {
    label: "Tool Center",
    title: "研究工具库",
    subtitle: "发现提升研究效率的工具，从 AI 助手到文献管理。",
    share: "分享工具",
    shareDesc: "推荐你常用的研究工具。",
    cardAuthor: "作者",
    cardViews: "浏览",
    cardLikes: "点赞",
    noResults: "未找到相关工具",
    noResultsHint: "试试其他分类、清除筛选条件，或使用更宽泛的搜索词。",
  },
  en: {
    label: "Tool Center",
    title: "Research Tools Library",
    subtitle: "Discover tools to boost your research efficiency, from AI assistants to reference managers.",
    share: "Share a Tool",
    shareDesc: "Recommend your favorite research tools.",
    cardAuthor: "Author",
    cardViews: "Views",
    cardLikes: "Likes",
    noResults: "No tools found",
    noResultsHint: "Try a different category, clear your filters, or search with broader terms.",
  },
} as const;

function PageHero({
  title,
  subtitle,
}: {
  label: string;
  title: string;
  subtitle: string;
}) {
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

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
      <p className="text-lg font-medium text-[var(--color-text-primary)]">
        {title}
      </p>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{hint}</p>
    </div>
  );
}

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ToolsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;

  const t = i18n[locale as keyof typeof i18n] || i18n.zh;

  const pageValue =
    typeof resolvedSearchParams.page === "string" ? resolvedSearchParams.page : "1";
  const page = Math.max(1, parseInt(pageValue || "1", 10));
  const category =
    (typeof resolvedSearchParams.category === "string"
      ? resolvedSearchParams.category
      : "") || "";
  const tag =
    (typeof resolvedSearchParams.tag === "string" ? resolvedSearchParams.tag : "") || "";
  const search =
    (typeof resolvedSearchParams.search === "string"
      ? resolvedSearchParams.search
      : "") || "";
  const subcategory =
    (typeof resolvedSearchParams.subcategory === "string"
      ? resolvedSearchParams.subcategory
      : "") || "";

  const [{ tools, totalPages, loadError }, categories] = await Promise.all([
    fetchTools({ page, category, subcategory, tag, search }),
    fetchToolCategories(locale),
  ]);

  const qsParts: string[] = [];
  if (category) qsParts.push(`category=${encodeURIComponent(category)}`);
  if (subcategory) qsParts.push(`subcategory=${encodeURIComponent(subcategory)}`);
  if (tag) qsParts.push(`tag=${encodeURIComponent(tag)}`);
  if (search) qsParts.push(`search=${encodeURIComponent(search)}`);
  const queryString = qsParts.join("&");

  return (
    <PageShell>
      <Reveal>
        <PageHero label={t.label} title={t.title} subtitle={t.subtitle} />
      </Reveal>

      {/* Search Bar - Replaces Featured Carousel */}
      <div className="mb-8">
        <Reveal delay={0} threshold={0.12}>
          <ToolSearchBar />
        </Reveal>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 mt-12">
        <Reveal delay={100} className="w-full lg:w-64 shrink-0">
          <ToolSidebarFilters categories={categories} />
        </Reveal>

        <div className="flex-1 min-w-0">
          <Reveal delay={200}>
            <ToolActiveFilters />
          </Reveal>

          <Reveal delay={300}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-2">
              {tools.length === 0 && !loadError ? (
                <EmptyState title={t.noResults} hint={t.noResultsHint} />
              ) : (
                tools.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    labels={{
                      author: t.cardAuthor,
                      views: t.cardViews,
                      likes: t.cardLikes,
                    }}
                  />
                ))
              )}
            </div>
          </Reveal>

          {totalPages > 1 && (
            <Reveal delay={400}>
              <div className="mt-8">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  basePath="/tools"
                  queryString={queryString}
                />
              </div>
            </Reveal>
          )}

          {loadError && (
            <div className="mt-4 text-center text-sm text-red-500">
              {loadError}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
