import PageShell from "@/components/layout/PageShell";
import SkillCard from "@/components/skills/SkillCard";
import Pagination from "@/components/shared/Pagination";
import Reveal from "@/components/shared/Reveal";
import {
  fetchSkillCategories,
  fetchSkills,
  fetchSkillSubcategories,
} from "@/lib/skills";
import {
  SkillActiveFilters,
  SkillDropdownFilters,
  SkillSearchBar,
  SkillSidebar,
} from "@/components/skills/SkillLayoutFilters";

const i18n = {
  zh: {
    label: "Skills Hub",
    title: "技能目录",
    subtitle: "按通用技能与学科技能浏览收录条目，并支持工作流和平台筛选。",
    cardAuthor: "作者",
    cardViews: "浏览",
    cardLikes: "点赞",
    noResults: "未找到相关技能",
    noResultsHint: "试试其他分类、清除筛选条件，或使用更宽泛的搜索词。",
  },
  en: {
    label: "Skills Hub",
    title: "Skills Directory",
    subtitle: "Browse entries by general and discipline skills, with workflow and platform filters.",
    cardAuthor: "Author",
    cardViews: "Views",
    cardLikes: "Likes",
    noResults: "No skills found",
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

export default async function SkillsPage({ params, searchParams }: PageProps) {
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

  const [
    { skills, totalPages, total, loadError },
    categories,
    subcategoryMap,
  ] = await Promise.all([
    fetchSkills({ page, category, subcategory, tag, search }),
    fetchSkillCategories(locale),
    fetchSkillSubcategories(),
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

      <div className="mb-8">
        <Reveal delay={100}>
          <SkillSearchBar />
        </Reveal>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <Reveal delay={200} className="w-full lg:w-64 shrink-0">
          <SkillSidebar
            categories={categories}
            availableSubcategories={subcategoryMap}
          />
        </Reveal>

        <div className="flex-1 min-w-0">
          <Reveal delay={300}>
            <SkillActiveFilters />
          </Reveal>

          <Reveal delay={350}>
            <SkillDropdownFilters totalResults={total} currentPage={page} totalPages={totalPages} />
          </Reveal>

          <Reveal delay={400}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-2">
              {skills.length === 0 && !loadError ? (
                <EmptyState title={t.noResults} hint={t.noResultsHint} />
              ) : (
                skills.map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    locale={locale}
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
            <Reveal delay={500}>
              <div className="mt-8">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  basePath="/skills"
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
