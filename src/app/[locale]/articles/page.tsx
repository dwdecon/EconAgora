import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import Reveal from "@/components/shared/Reveal";
import BlogCard from "@/components/blog/BlogCard";
import { getBlogPostsFromFiles } from "@/lib/blog-content";

const copy = {
  zh: {
    label: "Blog",
    title: "全部文章",
    description: "浏览所有技术专栏文章，从 AI Agent 设置到因果推断审计。",
    backToBlog: "返回 Blog 首页",
    allLabel: "全部文章",
  },
  en: {
    label: "Blog",
    title: "All Articles",
    description: "Browse all technical column articles, from AI Agent setup to causal inference auditing.",
    backToBlog: "Back to Blog",
    allLabel: "All Articles",
  },
} as const;

export default async function ArticlesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = locale === "en" ? copy.en : copy.zh;

  const filePosts = await getBlogPostsFromFiles(locale);

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
    viewCount: 0,
    likeCount: 0,
  }));

  return (
    <PageShell className="pb-20">
      {/* Header */}
      <Reveal threshold={0.12}>
        <section className="relative overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-card)] px-8 py-16 md:px-12 md:py-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--color-primary)_0%,transparent_34%),radial-gradient(circle_at_bottom_left,rgba(217,199,162,0.35),transparent_42%)] opacity-[0.03]" />
          <div className="relative">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1 text-[14px] font-medium text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.backToBlog}
            </Link>
            <h1 className="mt-6 text-[40px] font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--color-text-primary)] md:text-[56px]">
              {t.title}
            </h1>
            <p className="mt-6 max-w-[560px] text-[17px] leading-[1.78] text-[var(--color-text-secondary)]">
              {t.description}
            </p>
          </div>
        </section>
      </Reveal>

      {/* Posts Grid */}
      <section className="mt-20">
        <Reveal threshold={0.12}>
          <div className="mb-8 flex items-end justify-between">
            <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
              {t.allLabel}
              <span className="ml-2 text-[var(--color-text-secondary)]">
                ({allPosts.length})
              </span>
            </p>
          </div>
        </Reveal>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {allPosts.map((post, index) => (
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
