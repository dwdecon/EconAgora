import { Suspense } from "react";
import PageShell from "@/components/layout/PageShell";
import ToolCarousel from "@/components/tools/ToolCarousel";
import ToolFilters from "@/components/tools/ToolFilters";
import ToolCard from "@/components/tools/ToolCard";
import CreateNewCard from "@/components/shared/CreateNewCard";
import Pagination from "@/components/shared/Pagination";
import Reveal from "@/components/shared/Reveal";
import { fetchTools, fetchFeaturedTools } from "@/lib/tools";

const i18n = {
  zh: {
    label: "工具中心",
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
  label,
  title,
  subtitle,
}: {
  label: string;
  title: string;
  subtitle: string;
}) {
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
  searchParams: Promise<{
    page?: string;
    category?: string;
    tag?: string;
    search?: string;
  }>;
}

export default async function ToolsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;

  const t = i18n[locale as keyof typeof i18n] || i18n.zh;

  const page = Math.max(1, parseInt(resolvedSearchParams.page || "1", 10));
  const category = resolvedSearchParams.category || "";
  const tag = resolvedSearchParams.tag || "";
  const search = resolvedSearchParams.search || "";

  const [{ tools, totalPages, loadError }, featuredTools] = await Promise.all([
    fetchTools({ page, category, tag, search }),
    page === 1 ? fetchFeaturedTools() : Promise.resolve([]),
  ]);

  return (
    <PageShell>
      <Reveal>
        <PageHero label={t.label} title={t.title} subtitle={t.subtitle} />
      </Reveal>

      {featuredTools.length > 0 && (
        <Reveal delay={100}>
          <div className="mb-8 -mx-4 md:-mx-8">
            <ToolCarousel
              tools={featuredTools}
              labels={{
                author: t.cardAuthor,
                views: t.cardViews,
                likes: t.cardLikes,
              }}
            />
          </div>
        </Reveal>
      )}

      <Reveal delay={200}>
        <div className="mb-6">
          <ToolFilters />
        </div>
      </Reveal>

      <Reveal delay={300}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <CreateNewCard href="/tools/new" title={t.share} description={t.shareDesc} />

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
            />
          </div>
        </Reveal>
      )}

      {loadError && (
        <div className="mt-4 text-center text-sm text-red-500">
          {loadError}
        </div>
      )}
    </PageShell>
  );
}