"use client";

import { useEffect, useRef, useState } from "react";
import { Eye } from "lucide-react";

const i18n = {
  zh: {
    views: "浏览",
  },
  en: {
    views: "Views",
  },
} as const;

export default function BlogViewCounter({
  slug,
  locale,
}: {
  slug: string;
  locale: string;
}) {
  const t = i18n[locale as keyof typeof i18n] || i18n.zh;
  const [viewCount, setViewCount] = useState<number | null>(null);
  const viewTracked = useRef(false);

  // Fetch initial view count
  useEffect(() => {
    fetch(`/api/blog/view?slug=${encodeURIComponent(slug)}`)
      .then((response) => response.json())
      .then((data) => {
        setViewCount(data.views || 0);
      })
      .catch(() => {
        setViewCount(0);
      });
  }, [slug]);

  // Track view on mount
  useEffect(() => {
    if (viewTracked.current) return;
    viewTracked.current = true;

    fetch("/api/blog/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.views !== undefined) {
          setViewCount(data.views);
        }
      })
      .catch(() => {});
  }, [slug]);

  if (viewCount === null) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-text-muted)]">
        <Eye className="h-3.5 w-3.5" />
        <span className="inline-block h-3.5 w-8 animate-pulse rounded bg-[var(--color-bg-surface)]" />
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-text-muted)]">
      <Eye className="h-3.5 w-3.5" />
      {viewCount.toLocaleString()} {t.views}
    </span>
  );
}
