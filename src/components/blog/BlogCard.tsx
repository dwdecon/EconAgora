import { Link } from "@/i18n/navigation";
import { ArrowUpRight } from "lucide-react";
import { formatBlogDate } from "@/lib/blog";

interface BlogCardProps {
  slug: string;
  title: string;
  excerpt: string;
  cover?: string;
  category: string;
  date: string;
  readTime: string;
  author: string;
  locale: string;
  variant?: "default" | "compact";
}

export default function BlogCard({
  slug,
  title,
  excerpt,
  cover,
  category,
  date,
  readTime,
  author,
  locale,
  variant = "default",
}: BlogCardProps) {
  if (variant === "compact") {
    return (
      <Link
        href={`/blog/${slug}`}
        className="group flex flex-col gap-4"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 text-[12px] text-[var(--color-text-muted)]">
              <span className="font-medium uppercase tracking-wide">{category}</span>
              <span>·</span>
              <time>{formatBlogDate(date, locale)}</time>
            </div>
            <h3 className="mt-2 text-[18px] font-semibold leading-[1.4] tracking-[-0.01em] text-[var(--color-text-primary)] transition group-hover:text-[var(--color-primary)]">
              {title}
            </h3>
            <p className="mt-2 line-clamp-2 text-[14px] leading-[1.6] text-[var(--color-text-secondary)]">
              {excerpt}
            </p>
          </div>
          <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-[var(--color-text-muted)] transition group-hover:text-[var(--color-primary)]" />
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/blog/${slug}`}
      className="group flex flex-col gap-4"
    >
      {/* Cover Image */}
      {cover && (
        <div className="relative aspect-[16/10] overflow-hidden rounded-[16px] bg-[var(--color-bg-surface)]">
          <img
            src={cover}
            alt={title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        </div>
      )}

      {/* Meta */}
      <div className="flex items-center gap-3 text-[12px] text-[var(--color-text-muted)]">
        <span className="font-medium uppercase tracking-wide">{category}</span>
        <span>·</span>
        <time>{formatBlogDate(date, locale)}</time>
        <span>·</span>
        <span>{readTime}</span>
      </div>

      {/* Title */}
      <h3 className="text-[20px] font-semibold leading-[1.3] tracking-[-0.01em] text-[var(--color-text-primary)] transition group-hover:text-[var(--color-primary)]">
        {title}
      </h3>

      {/* Excerpt */}
      <p className="line-clamp-3 text-[15px] leading-[1.6] text-[var(--color-text-secondary)]">
        {excerpt}
      </p>

      {/* Author */}
      <div className="mt-auto flex items-center gap-2 text-[13px] text-[var(--color-text-muted)]">
        <span>{author}</span>
      </div>
    </Link>
  );
}
