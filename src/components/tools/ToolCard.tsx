"use client";

import { Eye, Heart, ExternalLink } from "lucide-react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
} from "react";
import { useRouter } from "@/i18n/navigation";
import type { Tool } from "@/lib/tools";
import { getCategoryTheme } from "@/lib/category-theme";

interface ToolCardProps {
  tool: Tool;
  labels: {
    author: string;
    views: string;
    likes: string;
  };
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    notation: value >= 1000 ? "compact" : "standard",
  }).format(value);
}

function shouldSkipNavigation(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    Boolean(target.closest("[data-prevent-navigation='true']"))
  );
}

export default function ToolCard({ tool, labels }: ToolCardProps) {
  const router = useRouter();
  const categoryTheme = getCategoryTheme(tool.category);
  const displayTag = tool.subcategory || tool.category;

  function navigateToDetail() {
    router.push(`/tools/${tool.id}`);
  }

  function handleCardClick(event: ReactMouseEvent<HTMLElement>) {
    if (shouldSkipNavigation(event.target)) return;
    navigateToDetail();
  }

  function handleCardKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (shouldSkipNavigation(event.target)) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigateToDetail();
    }
  }

  return (
    <article
      role="link"
      tabIndex={0}
      aria-label={tool.title}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 text-[var(--color-text-primary)] transition-all duration-300 ease-out hover:border-[var(--color-border-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-hover)] dark:focus-visible:ring-white/15 sm:p-6 min-h-[280px]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] ${categoryTheme}`}
          >
            {displayTag}
          </span>
        </div>

        {tool.officialUrl && (
          <a
            href={tool.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            data-prevent-navigation="true"
            className="shrink-0 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-2 text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)] transition-colors"
            title="Official Website"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>

      <h3 className="mt-5 text-[1.25rem] font-normal leading-[1.25] text-[var(--color-text-primary)]">
        {tool.title}
      </h3>

      <p className="mt-3 text-[14px] text-[var(--color-text-secondary)] break-words">
        {labels.author}: {tool.author.name}
      </p>

      <p className="mt-3 line-clamp-2 text-[14px] leading-[1.5] text-[var(--color-text-secondary)]">
        {tool.description || "研究工具，提升你的工作效率。"}
      </p>

      <div className="mt-auto flex items-end justify-between gap-4 pt-6">
        <div className="flex flex-wrap gap-2">
          {tool.tags.filter((tag: string) => tag !== tool.category).slice(0, 3).map((tag: string) => (
            <span
              key={tag}
              className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-secondary)]"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-3 text-xs font-medium text-[var(--color-text-secondary)]">
          <span className="inline-flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            {formatCount(tool.viewCount)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5" />
            {formatCount(tool.likeCount)}
          </span>
        </div>
      </div>
    </article>
  );
}
