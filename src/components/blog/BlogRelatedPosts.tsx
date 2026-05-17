import { Link } from "@/i18n/navigation";
import { ArrowUpRight } from "lucide-react";
import { getBlogPostsFromFiles } from "@/lib/blog-content";
import { formatBlogDate } from "@/lib/blog";

interface BlogRelatedPostsProps {
  currentSlug: string;
  category: string;
  locale: string;
}

export default async function BlogRelatedPosts({
  currentSlug,
  category,
  locale,
}: BlogRelatedPostsProps) {
  // Get related posts from file system
  const allPosts = await getBlogPostsFromFiles(locale);
  const related = allPosts
    .filter(
      (p) =>
        p.frontmatter.slug !== currentSlug &&
        p.frontmatter.category === category &&
        p.frontmatter.status !== "draft"
    )
    .slice(0, 3)
    .map((p) => ({
      slug: p.frontmatter.slug,
      title: p.frontmatter.title,
      cover: p.frontmatter.cover || p.frontmatter.illustration || "",
      category: p.frontmatter.category,
      date: p.frontmatter.date,
    }));

  if (related.length === 0) return null;

  const t = locale === "en" ? "Related articles" : "相关文章";

  return (
    <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6 md:p-8">
      <p className="mb-8 text-[12px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
        {t}
      </p>

      <div className="grid gap-6 md:grid-cols-3">
        {related.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex flex-col gap-3"
          >
            {post.cover && (
              <div className="relative aspect-[16/10] overflow-hidden rounded-[12px] bg-[var(--color-bg-card)]">
                <img
                  src={post.cover}
                  alt={post.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              </div>
            )}

            <div className="flex items-center gap-2 text-[12px] text-[var(--color-text-muted)]">
              <span className="font-medium uppercase tracking-wide">
                {post.category}
              </span>
              <span>·</span>
              <time>{formatBlogDate(post.date, locale)}</time>
            </div>

            <h4 className="text-[16px] font-semibold leading-[1.4] text-[var(--color-text-primary)] transition group-hover:text-[var(--color-primary)]">
              {post.title}
            </h4>

            <ArrowUpRight className="mt-auto h-4 w-4 text-[var(--color-text-muted)] transition group-hover:text-[var(--color-primary)]" />
          </Link>
        ))}
      </div>
    </div>
  );
}
