import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { ChevronLeft, Eye, Heart, ExternalLink } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";
import SkillCard from "@/components/skills/SkillCard";
import { fetchSkillById, fetchRelatedSkills } from "@/lib/skills";

const i18n = {
  zh: {
    backToSkills: "返回技能库",
    tutorial: "使用教程",
    codeExamples: "代码示例",
    useCases: "应用场景",
    related: "相关技能",
    views: "浏览",
    likes: "点赞",
    cardAuthor: "作者",
  },
  en: {
    backToSkills: "Back to Skills",
    tutorial: "Tutorial",
    codeExamples: "Code Examples",
    useCases: "Use Cases",
    related: "Related Skills",
    views: "Views",
    likes: "Likes",
    cardAuthor: "Author",
  },
} as const;

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    notation: value >= 1000 ? "compact" : "standard",
  }).format(value);
}

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function SkillDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const t = i18n[locale as keyof typeof i18n] || i18n.zh;

  const skill = await fetchSkillById(slug);

  if (!skill) {
    notFound();
  }

  const relatedSkills = await fetchRelatedSkills(slug, skill.category);

  return (
    <PageShell>
      <div className="mb-6">
        <Link
          href="/skills"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition"
        >
          <ChevronLeft className="h-4 w-4" />
          {t.backToSkills}
        </Link>
      </div>

      <article className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
              {skill.category}
            </span>
            {skill.tags
              .filter((tag) => tag !== skill.category)
              .slice(0, 4)
              .map((tag) => (
                <span
                  key={tag}
                  className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-secondary)]"
                >
                  {tag}
                </span>
              ))}
          </div>

          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            {skill.title}
          </h1>

          {skill.description && (
            <p className="mt-4 text-lg text-[var(--color-text-secondary)]">
              {skill.description}
            </p>
          )}

          <div className="mt-6 flex items-center gap-6 text-sm text-[var(--color-text-secondary)]">
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              {formatCount(skill.viewCount)} {t.views}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Heart className="h-4 w-4" />
              {formatCount(skill.likeCount)} {t.likes}
            </span>
          </div>
        </header>

        {/* Tutorial */}
        {skill.tutorial && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
              {t.tutorial}
            </h2>
            <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
              <MarkdownRenderer content={skill.tutorial} />
            </div>
          </section>
        )}

        {/* Code Examples */}
        {skill.codeExamples && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
              {t.codeExamples}
            </h2>
            <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
              <MarkdownRenderer content={skill.codeExamples} />
            </div>
          </section>
        )}

        {/* Use Cases */}
        {skill.useCases && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
              {t.useCases}
            </h2>
            <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
              <MarkdownRenderer content={skill.useCases} />
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
      </article>
    </PageShell>
  );
}