import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import Reveal from "@/components/shared/Reveal";
import BlogCard from "@/components/blog/BlogCard";
import { getPostsByTag, getAllTags } from "@/lib/blog-data";

const copy = {
  zh: {
    back: "返回标签索引",
    articles: "篇文章",
    empty: "该标签下暂无已发布文章。",
  },
  en: {
    back: "Back to tags",
    articles: "articles",
    empty: "No published articles with this tag yet.",
  },
} as const;

export default async function TagDetailPage({
  params,
}: {
  params: Promise<{ locale: string; tag: string }>;
}) {
  const { locale, tag } = await params;
  const t = locale === "en" ? copy.en : copy.zh;

  const decodedTag = decodeURIComponent(tag);
  const posts = await getPostsByTag(decodedTag, locale);

  // Validate tag exists
  const allTags = await getAllTags(locale);
  if (!allTags.includes(decodedTag)) {
    notFound();
  }

  return (
    <PageShell className="pb-20">
      {/* Back */}
      <Link
        href="/tags"
        className="inline-flex items-center gap-2 text-[14px] font-medium text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        {t.back}
      </Link>

      {/* Header */}
      <Reveal threshold={0.12}>
        <header className="mt-12">
          <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
            Tag
          </p>
          <h1 className="mt-4 text-[36px] font-semibold leading-[1.15] tracking-[-0.02em] text-[var(--color-text-primary)] md:text-[48px]">
            {decodedTag}
          </h1>
          <p className="mt-4 text-[15px] text-[var(--color-text-secondary)]">
            {posts.length} {t.articles}
          </p>
        </header>
      </Reveal>

      {/* Posts */}
      <section className="mt-12">
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
