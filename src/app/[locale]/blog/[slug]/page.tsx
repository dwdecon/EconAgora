import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import PageShell from "@/components/layout/PageShell";
import Reveal from "@/components/shared/Reveal";
import BlogBookCard from "@/components/blog/BlogBookCard";
import {
  formatBlogDate,
  getBlogEntryBySlug,
  getRelatedBlogEntries,
} from "@/lib/blog";

const copy = {
  zh: {
    label: "Blog",
    back: "返回 Blog",
    index: "专栏索引",
    related: "继续抽一本",
    relatedDescription: "同一书架上的其他专栏，继续沿着研究系统、复现和 agent 工作流往下读。",
  },
  en: {
    label: "Blog",
    back: "Back to Blog",
    index: "Shelf Index",
    related: "Pull Another Volume",
    relatedDescription: "Continue through the same shelf of essays on research systems, replication, and agent workflows.",
  },
} as const;

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = locale === "en" ? copy.en : copy.zh;
  const article = getBlogEntryBySlug(slug, locale);

  if (!article) {
    notFound();
  }

  const related = getRelatedBlogEntries(slug, locale);
  const coverStyle = {
    background: `linear-gradient(160deg, ${article.theme.coverStart} 0%, ${article.theme.coverEnd} 100%)`,
    boxShadow: `18px 24px 52px ${article.theme.shadow}`,
  };
  const spineStyle = {
    background: `linear-gradient(180deg, ${article.theme.spine} 0%, ${article.theme.accent} 100%)`,
  };

  return (
    <>
      <PageShell className="pb-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-[13px] font-medium text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.back}
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
          <Reveal threshold={0.12}>
            <div
              className="relative overflow-hidden rounded-[34px] border border-[var(--color-border)]"
              style={coverStyle}
            >
              <div className="absolute inset-y-0 left-0 w-10" style={spineStyle}>
                <div className="absolute inset-y-5 right-1 w-px bg-white/25" />
              </div>
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18),transparent_32%,rgba(32,23,15,0.08)_100%)]" />
              <div className="relative flex min-h-[500px] flex-col justify-between px-8 py-8 pl-16">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgba(28,28,28,0.5)]">
                    {article.issue}
                  </p>
                  <p className="mt-8 max-w-[10ch] text-[40px] font-semibold leading-[0.94] tracking-[-0.06em] text-[#20170f]">
                    {article.title}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[rgba(28,28,28,0.42)]">
                    {article.coverNote}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-black/10 bg-white/35 px-3 py-1 text-[11px] font-medium text-[rgba(32,23,15,0.72)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={80} threshold={0.12}>
            <div>
              <p className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-secondary)]">
                {t.label}
              </p>
              <h1 className="mt-5 max-w-[16ch] text-[44px] font-semibold leading-[0.94] tracking-[-0.06em] text-[var(--color-text-primary)] md:text-[60px]">
                {article.title}
              </h1>
              <p className="mt-6 max-w-[54ch] text-[17px] leading-[1.85] text-[var(--color-text-secondary)]">
                {article.excerpt}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {article.stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-[22px] border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-4"
                  >
                    <p className="text-[24px] font-semibold tracking-[-0.04em] text-[var(--color-text-primary)]">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-[12px] leading-5 text-[var(--color-text-secondary)]">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6">
                <div className="flex flex-wrap items-center gap-3 text-[13px] leading-6 text-[var(--color-text-secondary)]">
                  <span>{article.category}</span>
                  <span className="text-[var(--color-text-muted)]">/</span>
                  <span>{formatBlogDate(article.publishedAt, locale)}</span>
                  <span className="text-[var(--color-text-muted)]">/</span>
                  <span>{article.readTime}</span>
                </div>
                <div className="mt-5">
                  <p className="text-[12px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                    {article.author.role}
                  </p>
                  <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em] text-[var(--color-text-primary)]">
                    {article.author.name}
                  </p>
                </div>
                <div className="mt-6 border-t border-[var(--color-border)] pt-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                    {t.index}
                  </p>
                  <div className="mt-4 space-y-3">
                    {article.shelfIndex.map((item, index) => (
                      <div key={item} className="flex gap-4">
                        <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <p className="text-[14px] leading-6 text-[var(--color-text-secondary)]">
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </PageShell>

      <PageShell width="article" className="pt-6 pb-10">
        <Reveal threshold={0.12}>
          <article className="prose-article">
            <p className="text-[17px] leading-[1.9] text-[var(--color-text-secondary)]">
              {article.lead}
            </p>
            {article.sections.map((section) => (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.bullets ? (
                  <ul>
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </article>
        </Reveal>
      </PageShell>

      <PageShell className="pt-0 pb-20">
        <Reveal threshold={0.12}>
          <div className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6 md:p-8">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                  {t.related}
                </p>
                <h2 className="mt-3 text-[34px] font-semibold leading-[0.98] tracking-[-0.05em] text-[var(--color-text-primary)]">
                  {t.label}
                </h2>
              </div>
              <p className="max-w-[48ch] text-[15px] leading-7 text-[var(--color-text-secondary)]">
                {t.relatedDescription}
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {related.map((entry) => (
                <BlogBookCard key={entry.slug} article={entry} compact />
              ))}
            </div>
          </div>
        </Reveal>
      </PageShell>
    </>
  );
}
