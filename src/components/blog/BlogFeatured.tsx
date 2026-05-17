import { Link } from "@/i18n/navigation";
import { ArrowUpRight } from "lucide-react";
import { formatBlogDate } from "@/lib/blog";

interface BlogFeaturedProps {
  slug: string;
  title: string;
  excerpt: string;
  cover?: string;
  category: string;
  date: string;
  readTime: string;
  author: string;
  locale: string;
}

export default function BlogFeatured({
  slug,
  title,
  excerpt,
  cover,
  category,
  date,
  readTime,
  author,
  locale,
}: BlogFeaturedProps) {
  return (
    <Link
      href={`/blog/${slug}`}
      className="group grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center"
    >
      {/* Cover Image */}
      {cover && (
        <div className="relative aspect-[16/10] overflow-hidden rounded-[20px] bg-[var(--color-bg-surface)] lg:aspect-[4/3]">
          <img
            src={cover}
            alt={title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 text-[12px] text-[var(--color-text-muted)]">
          <span className="font-medium uppercase tracking-wide">{category}</span>
          <span>·</span>
          <time>{formatBlogDate(date, locale)}</time>
          <span>·</span>
          <span>{readTime}</span>
        </div>

        <h2 className="text-[28px] font-semibold leading-[1.2] tracking-[-0.02em] text-[var(--color-text-primary)] transition group-hover:text-[var(--color-primary)] md:text-[36px]">
          {title}
        </h2>

        <p className="max-w-[480px] text-[16px] leading-[1.7] text-[var(--color-text-secondary)]">
          {excerpt}
        </p>

        <div className="mt-2 flex items-center gap-2 text-[13px] text-[var(--color-text-muted)]">
          <span>{author}</span>
        </div>

        <div className="mt-2 inline-flex items-center gap-1 text-[14px] font-medium text-[var(--color-text-primary)] transition group-hover:text-[var(--color-primary)]">
          阅读文章
          <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>
    </Link>
  );
}
