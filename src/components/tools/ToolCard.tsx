"use client";

import { Eye, Heart, ExternalLink } from "lucide-react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
} from "react";
import { useRouter } from "@/i18n/navigation";
import type { Tool } from "@/lib/tools";

const CATEGORY_THEME: Record<string, string> = {
  "AI Assistant": "border-purple-200/70 bg-purple-50/80 text-purple-700",
  "Reference Management": "border-blue-200/70 bg-blue-50/80 text-blue-700",
  Writing: "border-emerald-200/70 bg-emerald-50/80 text-emerald-700",
  Visualization: "border-amber-200/70 bg-amber-50/80 text-amber-700",
  "Data Analysis": "border-sky-200/70 bg-sky-50/80 text-sky-700",
  Default:
    "border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)]",
};

interface ToolCardProps {
  tool: Tool;
  labels: {
    author: string;
    views: string;
    likes: string;
  };
}

function Avatar({
  name,
  src,
  compact = false,
}: {
  name: string;
  src: string | null;
  compact?: boolean;
}) {
  const sizeClass = compact ? "h-7 w-7" : "h-10 w-10";

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClass} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[10px] font-semibold uppercase text-[var(--color-text-secondary)]`}
    >
      {name?.charAt(0) ?? "?"}
    </div>
  );
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
  const categoryTheme = CATEGORY_THEME[tool.category] || CATEGORY_THEME.Default;
  const metaTags = tool.tags.filter((tag) => tag !== tool.category).slice(0, 3);

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
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 text-[var(--color-text-primary)] transition-all duration-500 ease-out hover:border-black/10 hover:shadow-xl hover:shadow-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10 dark:hover:border-white/15 dark:focus-visible:ring-white/15 sm:p-5 hover:-translate-y-1 min-h-[280px]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] ${categoryTheme}`}
          >
            {tool.category}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {tool.officialUrl && (
            <a
              href={tool.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              data-prevent-navigation="true"
              className="shrink-0 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-2 text-[var(--color-text-secondary)] hover:text-primary transition"
              title="Official Website"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}

          <div
            className="inline-flex max-w-[48%] shrink-0 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-2.5 py-1.5 text-xs text-[var(--color-text-primary)]"
            aria-label={labels.author}
            title={labels.author}
          >
            <Avatar name={tool.author.name} src={tool.author.avatar} compact />
            <span className="truncate font-medium">{tool.author.name}</span>
          </div>
        </div>
      </div>

      <h3 className="mt-5 text-[1.5rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[var(--color-text-primary)]">
        {tool.title}
      </h3>

      <p className="mt-3 line-clamp-2 text-[15px] leading-7 text-[var(--color-text-secondary)]">
        {tool.description || "研究工具，提升你的工作效率。"}
      </p>

      <div className="mt-auto flex items-end justify-between gap-4 border-t border-[var(--color-border)] pt-4">
        <div className="flex flex-wrap gap-2">
          {metaTags.map((tag) => (
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