import Image from "next/image";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { ChevronLeft } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";
import SkillCard from "@/components/skills/SkillCard";
import SkillSidebar from "@/components/skills/SkillSidebar";
import { fetchSkillById, fetchRelatedSkills } from "@/lib/skills";
import { getCategoryTheme } from "@/lib/category-theme";

const i18n = {
  zh: {
    backToSkills: "返回技能库",
    tutorial: "Skill内容",
    related: "相关技能",
    views: "浏览",
    likes: "点赞",
    cardAuthor: "作者",
    workflowStage: "工作流阶段",
    platform: "适用平台",
    about: "关于",
    stats: "统计",
    lastUpdated: "最后更新",
    category: "分类",
    tags: "标签",
    source: "来源",
    author: "作者",
  },
  en: {
    backToSkills: "Back to Skills",
    tutorial: "Skill Content",
    related: "Related Skills",
    views: "Views",
    likes: "Likes",
    cardAuthor: "Author",
    workflowStage: "Workflow Stage",
    platform: "Platform",
    about: "About",
    stats: "Statistics",
    lastUpdated: "Last updated",
    category: "Category",
    tags: "Tags",
    source: "Source",
    author: "Author",
  },
} as const;

interface PageProps {
  params: Promise<{ locale: string; slug: string[] }>;
}

export default async function SkillDetailPage({ params }: PageProps) {
  const { locale, slug: slugParts } = await params;
  const slug = slugParts.join("/");
  const t = i18n[locale as keyof typeof i18n] || i18n.zh;

  const skill = await fetchSkillById(slug);

  if (!skill) {
    notFound();
  }

  const relatedSkills = await fetchRelatedSkills(slug, skill.category);

  const initials = skill.author.name.charAt(0).toUpperCase();

  return (
    <PageShell width="6xl" className="pb-20">
      <div className="mb-6">
        <Link
          href="/skills"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition"
        >
          <ChevronLeft className="h-4 w-4" />
          {t.backToSkills}
        </Link>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* ── Left column ── */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <header className="mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className={`inline-flex items-center rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] ${getCategoryTheme(skill.category)}`}>
                {skill.category}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--color-text-primary)]">
              {skill.title}
            </h1>
            {locale === "zh" && skill.titleZh && (
              <p className="mt-2 text-lg text-[var(--color-text-secondary)]">
                {skill.titleZh}
              </p>
            )}

            {(locale === "zh" && skill.descriptionZh ? skill.descriptionZh : skill.description) && (
              <p className="mt-4 text-lg text-[var(--color-text-secondary)]">
                {locale === "zh" && skill.descriptionZh ? skill.descriptionZh : skill.description}
              </p>
            )}

            {/* Author */}
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <Link
                href={`/u/${skill.author.id}`}
                className="flex items-center gap-2 transition hover:opacity-80"
              >
                {skill.author.avatar ? (
                  <Image
                    src={skill.author.avatar}
                    alt={skill.author.name}
                    width={28}
                    height={28}
                    unoptimized
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[10px] font-semibold uppercase text-[var(--color-text-secondary)]">
                  {initials}
                </div>
                )}
                <span className="text-[14px] font-medium text-[var(--color-text-primary)] transition hover:text-[var(--color-text-secondary)]">
                  {skill.author.name}
                </span>
              </Link>
            </div>
          </header>

          {/* Tutorial / Skill MD */}
          {(skill.skillMd ?? skill.tutorial) && (
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
                {t.tutorial}
              </h2>
              <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
                <MarkdownRenderer content={skill.skillMd ?? skill.tutorial ?? ""} />
              </div>
            </section>
          )}

          {/* Related Skills */}
          {relatedSkills.length > 0 && (
            <section className="mt-16">
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">
                {t.related}
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {relatedSkills.map((relatedSkill) => (
                  <SkillCard
                    key={relatedSkill.id}
                    skill={relatedSkill}
                    locale={locale}
                    labels={{
                      author: t.cardAuthor,
                      views: t.views,
                      likes: t.likes,
                    }}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <SkillSidebar skill={skill} locale={locale} />
      </div>
    </PageShell>
  );
}
