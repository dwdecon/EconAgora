import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import Reveal from "@/components/shared/Reveal";
import BlogPostContent from "@/components/blog/BlogPostContent";
import BlogAuthorCard from "@/components/blog/BlogAuthorCard";
import BlogRelatedPosts from "@/components/blog/BlogRelatedPosts";
import BlogViewCounter from "@/components/blog/BlogViewCounter";
import TableOfContents from "@/components/blog/TableOfContents";
import SeriesNavigation from "@/components/blog/SeriesNavigation";
import {
  getBlogPostBySlug,
  getAllBlogSlugs,
  getSeriesById,
  getSeriesNeighbors,
  formatBlogDate,
} from "@/lib/blog-data";

export const dynamic = "force-static";

export async function generateStaticParams() {
  try {
    const slugs = await getAllBlogSlugs();
    return slugs.map(({ slug, locale }) => ({
      locale,
      slug,
    }));
  } catch (error) {
    console.error("[Blog] generateStaticParams error:", error);
    return [];
  }
}

const copy = {
  zh: {
    back: "返回 Blog",
    readTime: "阅读时间",
    author: "作者",
    category: "分类",
    tags: "标签",
    related: "相关文章",
    series: "系列",
    contents: "目录",
  },
  en: {
    back: "Back to Blog",
    readTime: "Read time",
    author: "Author",
    category: "Category",
    tags: "Tags",
    related: "Related articles",
    series: "Series",
    contents: "Contents",
  },
} as const;

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = locale === "en" ? copy.en : copy.zh;

  const filePost = await getBlogPostBySlug(slug, locale);

  if (!filePost) {
    notFound();
  }

  const post = {
    slug: filePost.frontmatter.slug,
    title: filePost.frontmatter.title,
    excerpt: filePost.frontmatter.excerpt,
    content: filePost.content,
    cover: filePost.frontmatter.cover || filePost.frontmatter.illustration || "",
    category: filePost.frontmatter.category,
    date: filePost.frontmatter.date,
    readTime: filePost.frontmatter.readTime,
    tags: filePost.frontmatter.tags,
    author: filePost.frontmatter.author,
    authorRole: filePost.frontmatter.authorRole,
    issue: filePost.frontmatter.issue,
    status: filePost.frontmatter.status || "published",
    series: filePost.frontmatter.series,
    seriesOrder: filePost.frontmatter.seriesOrder,
    viewCount: 0,
    likeCount: 0,
  };

  // Series info and neighbors
  let seriesInfo = null;
  let seriesNeighbors = { prev: null as any, next: null as any };

  if (post.series) {
    const [info, neighbors] = await Promise.all([
      getSeriesById(post.series),
      getSeriesNeighbors(slug, post.series, locale),
    ]);
    seriesInfo = info;
    seriesNeighbors = neighbors;
  }

  return (
    <>
      <PageShell className="pb-8">
        {/* Back Link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-[14px] font-medium text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.back}
        </Link>

        {/* Article Header */}
        <header className="mt-12 max-w-[720px]">
          <Reveal threshold={0.12}>
            <div className="flex flex-wrap items-center gap-3 text-[13px] text-[var(--color-text-muted)]">
              <span className="font-medium uppercase tracking-wide">
                {post.category}
              </span>
              <span>·</span>
              <time>{formatBlogDate(post.date, locale)}</time>
              <span>·</span>
              <span>{post.readTime}</span>
              <span>·</span>
              <BlogViewCounter slug={slug} locale={locale} />
            </div>
          </Reveal>

          <Reveal delay={60} threshold={0.12}>
            <h1 className="mt-6 text-[36px] font-semibold leading-[1.15] tracking-[-0.02em] text-[var(--color-text-primary)] md:text-[48px]">
              {post.title}
            </h1>
          </Reveal>

          <Reveal delay={100} threshold={0.12}>
            <p className="mt-6 text-[18px] leading-[1.7] text-[var(--color-text-secondary)]">
              {post.excerpt}
            </p>
          </Reveal>

          <Reveal delay={140} threshold={0.12}>
            <div className="mt-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-bg-surface)] text-[14px] font-semibold text-[var(--color-text-primary)]">
                {post.author.charAt(0)}
              </div>
              <div>
                <p className="text-[14px] font-medium text-[var(--color-text-primary)]">
                  {post.author}
                </p>
                <p className="text-[12px] text-[var(--color-text-muted)]">
                  {post.authorRole}
                </p>
              </div>
            </div>
          </Reveal>

          {/* Series badge */}
          {seriesInfo && (
            <Reveal delay={180} threshold={0.12}>
              <div className="mt-6">
                <Link
                  href={`/series/${seriesInfo.id}`}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-1.5 text-[13px] text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                >
                  <span className="text-[12px] uppercase tracking-wide text-[var(--color-text-muted)]">
                    {t.series}
                  </span>
                  <span>{seriesInfo.name}</span>
                  {post.seriesOrder && (
                    <span className="text-[var(--color-text-muted)]">
                      #{post.seriesOrder}
                    </span>
                  )}
                </Link>
              </div>
            </Reveal>
          )}
        </header>

        {/* Cover Image */}
        {post.cover && (
          <Reveal delay={180} threshold={0.12}>
            <div className="mt-12 overflow-hidden rounded-[20px]">
              <img
                src={post.cover}
                alt={post.title}
                className="w-full object-cover"
              />
            </div>
          </Reveal>
        )}
      </PageShell>

      {/* Article Content + Sidebar */}
      <PageShell width="6xl" className="pt-6 pb-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_280px]">
          <div>
            <Reveal threshold={0.08}>
              <BlogPostContent content={post.content} />
            </Reveal>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <Reveal delay={100} threshold={0.12}>
                <div className="mt-12 border-t border-[var(--color-border)] pt-8">
                  <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                    {t.tags}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/tags/${encodeURIComponent(tag)}`}
                        className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-1.5 text-[13px] text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
              </Reveal>
            )}

            {/* Series Navigation */}
            {seriesInfo && (
              <Reveal delay={120} threshold={0.12}>
                <div className="mt-8">
                  <SeriesNavigation
                    seriesName={seriesInfo.name}
                    seriesId={seriesInfo.id}
                    prev={
                      seriesNeighbors.prev
                        ? {
                            slug: seriesNeighbors.prev.frontmatter.slug,
                            title: seriesNeighbors.prev.frontmatter.title,
                          }
                        : null
                    }
                    next={
                      seriesNeighbors.next
                        ? {
                            slug: seriesNeighbors.next.frontmatter.slug,
                            title: seriesNeighbors.next.frontmatter.title,
                          }
                        : null
                    }
                    locale={locale}
                  />
                </div>
              </Reveal>
            )}
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-6">
              <TableOfContents content={post.content} locale={locale} />
            </div>
          </aside>
        </div>

        {/* Author Card */}
        <Reveal delay={140} threshold={0.12}>
          <div className="mt-12 max-w-[720px]">
            <BlogAuthorCard
              name={post.author}
              role={post.authorRole}
              locale={locale}
            />
          </div>
        </Reveal>
      </PageShell>

      {/* Related Posts */}
      <PageShell className="pt-0 pb-20">
        <Reveal threshold={0.12}>
          <BlogRelatedPosts
            currentSlug={slug}
            category={post.category}
            locale={locale}
          />
        </Reveal>
      </PageShell>
    </>
  );
}
