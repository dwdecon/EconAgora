import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, ArrowRight, Calendar } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import Reveal from "@/components/shared/Reveal";
import BlogCard from "@/components/blog/BlogCard";
import {
  getSeriesById,
  getPostsBySeries,
  formatBlogDate,
} from "@/lib/blog-data";

const copy = {
  zh: {
    back: "返回系列首页",
    articles: "文章列表",
    empty: "该系列暂无已发布文章。",
    updateFrequency: "更新频率",
  },
  en: {
    back: "Back to series",
    articles: "Articles",
    empty: "No published articles in this series yet.",
    updateFrequency: "Update frequency",
  },
} as const;

export default async function SeriesDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = locale === "en" ? copy.en : copy.zh;
  const isEn = locale === "en";

  const series = await getSeriesById(id);
  if (!series) {
    notFound();
  }

  const posts = await getPostsBySeries(id, locale);
  const name = isEn ? series.nameEn || series.name : series.name;
  const description = isEn
    ? series.descriptionEn || series.description
    : series.description;

  return (
    <PageShell className="pb-20">
      {/* Back */}
      <Link
        href="/series"
        className="inline-flex items-center gap-2 text-[14px] font-medium text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        {t.back}
      </Link>

      {/* Series Header */}
      <Reveal threshold={0.12}>
        <header className="mt-12 overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-card)] px-8 py-12 md:px-12 md:py-16">
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              background: series.color
                ? `radial-gradient(circle at top right, ${series.color}, transparent 60%)`
                : "transparent",
            }}
          />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-3 text-[13px] text-[var(--color-text-muted)]">
              <span className="font-medium uppercase tracking-wide">Series</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {isEn
                  ? series.updateFrequencyEn || series.updateFrequency
                  : series.updateFrequency}
              </span>
            </div>
            <h1 className="mt-6 text-[36px] font-semibold leading-[1.15] tracking-[-0.02em] text-[var(--color-text-primary)] md:text-[48px]">
              {name}
            </h1>
            <p className="mt-6 max-w-[680px] text-[18px] leading-[1.7] text-[var(--color-text-secondary)]">
              {description}
            </p>
          </div>
        </header>
      </Reveal>

      {/* Posts */}
      <section className="mt-16">
        <Reveal threshold={0.12}>
          <p className="mb-8 text-[12px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
            {t.articles}
          </p>
        </Reveal>

        {posts.length === 0 ? (
          <Reveal threshold={0.12}>
            <p className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8 text-[15px] text-[var(--color-text-secondary)]">
              {t.empty}
            </p>
          </Reveal>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <Reveal
                key={post.frontmatter.slug}
                delay={Math.min(index * 60, 400)}
                threshold={0.12}
              >
                <BlogCard
                  slug={post.frontmatter.slug}
                  title={post.frontmatter.title}
                  excerpt={post.frontmatter.excerpt}
                  cover={post.frontmatter.cover}
                  category={post.frontmatter.category}
                  date={post.frontmatter.date}
                  readTime={post.frontmatter.readTime}
                  author={post.frontmatter.author}
                  locale={locale}
                />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
