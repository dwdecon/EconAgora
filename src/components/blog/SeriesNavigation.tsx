"use client";

import { Link } from "@/i18n/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface SeriesPost {
  slug: string;
  title: string;
}

interface SeriesNavigationProps {
  seriesName: string;
  seriesId: string;
  prev: SeriesPost | null;
  next: SeriesPost | null;
  locale: string;
}

export default function SeriesNavigation({
  seriesName,
  seriesId,
  prev,
  next,
  locale,
}: SeriesNavigationProps) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
          {locale === "en" ? "Series" : "系列"}
        </span>
        <Link
          href={`/series/${seriesId}`}
          className="text-[13px] font-medium text-[var(--color-primary)] transition hover:underline"
        >
          {seriesName}
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {prev ? (
          <Link
            href={`/blog/${prev.slug}`}
            className="group flex flex-col gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4 transition hover:border-[var(--color-border-hover)]"
          >
            <span className="inline-flex items-center gap-1 text-[12px] text-[var(--color-text-muted)]">
              <ArrowLeft className="h-3.5 w-3.5" />
              {locale === "en" ? "Previous" : "上一篇"}
            </span>
            <span className="text-[15px] font-medium text-[var(--color-text-primary)] transition group-hover:text-[var(--color-primary)]">
              {prev.title}
            </span>
          </Link>
        ) : (
          <div />
        )}

        {next ? (
          <Link
            href={`/blog/${next.slug}`}
            className="group flex flex-col items-end gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4 text-right transition hover:border-[var(--color-border-hover)]"
          >
            <span className="inline-flex items-center gap-1 text-[12px] text-[var(--color-text-muted)]">
              {locale === "en" ? "Next" : "下一篇"}
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
            <span className="text-[15px] font-medium text-[var(--color-text-primary)] transition group-hover:text-[var(--color-primary)]">
              {next.title}
            </span>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
