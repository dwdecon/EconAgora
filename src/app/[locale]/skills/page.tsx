import { Suspense } from "react";
import PageShell from "@/components/layout/PageShell";
import SkillCarousel from "@/components/skills/SkillCarousel";
import SkillFilters from "@/components/skills/SkillFilters";
import SkillCard from "@/components/skills/SkillCard";
import CreateNewCard from "@/components/shared/CreateNewCard";
import Pagination from "@/components/shared/Pagination";
import Reveal from "@/components/shared/Reveal";
import { fetchSkills, fetchFeaturedSkills } from "@/lib/skills";
import { getTranslations } from "next-intl/server";

const i18n = {
  zh: {
    label: "技能中心",
    title: "研究技能库",
    subtitle: "浏览可复用的研究技能，涵盖数据清洗、可视化、文献分析等领域。",
    share: "分享你的技能",
    shareDesc: "将你的研究技能发布到社区。",
    cardAuthor: "作者",
    cardViews: "浏览",
    cardLikes: "点赞",
    noResults: "未找到相关技能",
    noResultsHint: "试试其他分类、清除筛选条件，或使用更宽泛的搜索词。",
  },
  en: {
    label: "Skill Hub",
    title: "Research Skills Library",
    subtitle: "Browse reusable research skills covering data cleaning, visualization, literature analysis, and more.",
    share: "Share Your Skill",
    shareDesc: "Publish your research skill to the community.",
    cardAuthor: "Author",
    cardViews: "Views",
    cardLikes: "Likes",
    noResults: "No skills found",
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

export default async function SkillsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;

  const t = i18n[locale as keyof typeof i18n] || i18n.zh;

  const page = Math.max(1, parseInt(resolvedSearchParams.page || "1", 10));
  const category = resolvedSearchParams.category || "";
  const tag = resolvedSearchParams.tag || "";
  const search = resolvedSearchParams.search || "";

  const [{ skills, totalPages, loadError }, featuredSkills] = await Promise.all([
    fetchSkills({ page, category, tag, search }),
    page === 1 ? fetchFeaturedSkills() : Promise.resolve([]),
  ]);

  return (
    <PageShell>
      <Reveal>
        <PageHero label={t.label} title={t.title} subtitle={t.subtitle} />
      </Reveal>

      {featuredSkills.length > 0 && (
        <Reveal delay={100}>
          <div className="mb-8 -mx-4 md:-mx-8">
            <SkillCarousel
              skills={featuredSkills}
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
          <SkillFilters />
        </div>
      </Reveal>

      <Reveal delay={300}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <CreateNewCard href="/skills/new" title={t.share} description={t.shareDesc} />

          {skills.length === 0 && !loadError ? (
            <EmptyState title={t.noResults} hint={t.noResultsHint} />
          ) : (
            skills.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
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
              basePath="/skills"
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