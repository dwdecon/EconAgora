"use server";

import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import PageShell from "@/components/layout/PageShell";
import Reveal from "@/components/shared/Reveal";
import BlogCard from "@/components/blog/BlogCard";
import BlogFeatured from "@/components/blog/BlogFeatured";
import SeriesCard from "@/components/blog/SeriesCard";
import { getBlogPosts, getSeriesDefinitions } from "@/lib/blog-data";

const copy = {
  zh: {
    label: "Blog",
    title: "经济学与 AI 的技术专栏",
    description:
      "像翻书一样浏览研究工作流、复现工程、因果推断审计和 agent 系统设计。内容按三大主线组织：AI 科研最佳实践、论文项目、研究动态。",
    seriesLabel: "三大主线",
    featuredLabel: "精选文章",
    latestLabel: "最新文章",
    allLabel: "全部文章",
    readMore: "阅读更多",
  },
  en: {
    label: "Blog",
    title: "Technical Notes on Economics × AI",
    description:
      "Browse research workflows, replication engineering, causal inference auditing, and agent system design. Content is organized into three tracks: AI research best practices, paper projects, and research news.",
    seriesLabel: "Three Tracks",
    featuredLabel: "Featured",
    latestLabel: "Latest",
    allLabel: "All Articles",
    readMore: "Read more",
  },
} as const;

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = locale === "en" ? copy.en : copy.zh;

  const [filePosts, series] = await Promise.all([
    getBlogPosts(locale),
    getSeriesDefinitions(),
  ]);

  const allPosts = filePosts.map((post) => ({
    slug: post.frontmatter.slug,
    title: post.frontmatter.title,
    excerpt: post.frontmatter.excerpt,
    content: post.content,
    cover: post.frontmatter.cover || post.frontmatter.illustration || "",
    category: post.frontmatter.category,
    date: post.frontmatter.date,
    readTime: post.frontmatter.readTime,
    tags: post.frontmatter.tags,
    author: post.frontmatter.author,
    authorRole: post.frontmatter.authorRole,
    issue: post.frontmatter.issue,
    status: post.frontmatter.status || "published",
    featured: post.frontmatter.featured || false,
    viewCount: 0,
    likeCount: 0,
  }));

  // Featured: first post with featured=true, otherwise first post
  const featured =
    allPosts.find((p) => p.status === "published" && p.featured) || allPosts[0];
  const regularPosts = allPosts.filter((p) => p.slug !== featured?.slug);

  return (
    <PageShell className="pb-20">
      {/* Hero Section */}
      <Reveal threshold={0.12}>
        <section className="relative overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-card)] px-8 py-16 md:px-12 md:py-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--color-primary)_0%,transparent_34%),radial-gradient(circle_at_bottom_left,rgba(217,199,162,0.35),transparent_42%)] opacity-[0.03]" />
          <div className="relative max-w-[720px]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
              {t.label}
            </p>
            <h1 className="mt-6 text-[40px] font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--color-text-primary)] md:text-[56px]">
              {t.title}
            </h1>
            <p className="mt-6 max-w-[560px] text-[17px] leading-[1.78] text-[var(--color-text-secondary)]">
              {t.description}
            </p>
          </div>
        </section>
      </Reveal>

      {/* Series Grid — the three main entrances */}
      <section className="mt-16">
        <Reveal threshold={0.12}>
          <div className="mb-8 flex items-end justify-between">
            <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
              {t.seriesLabel}
            </p>
            <Link
              href="/series"
              className="inline-flex items-center gap-1 text-[14px] font-medium text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]"
            >
              {t.allLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {series.map((s, index) => (
            <Reveal
              key={s.id}
              delay={Math.min(index * 80, 400)}
              threshold={0.12}
            >
              <SeriesCard
                id={s.id}
                name={s.name}
                nameEn={s.nameEn}
                description={s.description}
                descriptionEn={s.descriptionEn}
                updateFrequency={s.updateFrequency}
                updateFrequencyEn={s.updateFrequencyEn}
                cover={s.cover}
                color={s.color}
                locale={locale}
              />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Featured Post */}
      {featured && (
        <section className="mt-20">
          <Reveal threshold={0.12}>
            <p className="mb-6 text-[12px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
              {t.featuredLabel}
            </p>
          </Reveal>
          <Reveal delay={80} threshold={0.12}>
            <BlogFeatured
              slug={featured.slug}
              title={featured.title}
              excerpt={featured.excerpt}
              cover={featured.cover}
              category={featured.category}
              date={featured.date}
              readTime={featured.readTime}
              author={featured.author}
              locale={locale}
            />
          </Reveal>
        </section>
      )}

      {/* Latest Posts Grid */}
      <section className="mt-20">
        <Reveal threshold={0.12}>
          <div className="mb-8 flex items-end justify-between">
            <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
              {t.latestLabel}
            </p>
            {regularPosts.length > 6 && (
              <Link
                href="/articles"
                className="inline-flex items-center gap-1 text-[14px] font-medium text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]"
              >
                {t.allLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </Reveal>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {regularPosts.slice(0, 6).map((post, index) => (
            <Reveal
              key={post.slug}
              delay={Math.min(index * 60, 400)}
              threshold={0.12}
            >
              <BlogCard
                slug={post.slug}
                title={post.title}
                excerpt={post.excerpt}
                cover={post.cover}
                category={post.category}
                date={post.date}
                readTime={post.readTime}
                author={post.author}
                locale={locale}
              />
            </Reveal>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
