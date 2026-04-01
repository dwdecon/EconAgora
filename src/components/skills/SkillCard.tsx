"use client";

import { Eye, Heart } from "lucide-react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
} from "react";
import { useRouter } from "@/i18n/navigation";
import type { Skill } from "@/lib/skills";

const CATEGORY_THEME: Record<string, string> = {
  "Data Analysis": "border-sky-200/70 bg-sky-50/80 text-sky-700",
  Visualization: "border-emerald-200/70 bg-emerald-50/80 text-emerald-700",
  Writing: "border-violet-200/70 bg-violet-50/80 text-violet-700",
  Automation: "border-amber-200/70 bg-amber-50/80 text-amber-700",
  "API Integration": "border-rose-200/70 bg-rose-50/80 text-rose-700",
  Default:
    "border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)]",
};

interface SkillCardProps {
  skill: Skill;
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

export default function SkillCard({ skill, labels }: SkillCardProps) {
  const router = useRouter();
  const categoryTheme =
    CATEGORY_THEME[skill.category] || CATEGORY_THEME.Default;
  const metaTags = skill.tags.filter((tag) => tag !== skill.category).slice(0, 3);

  function navigateToDetail() {
    router.push(`/skills/${skill.id}`);
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
      aria-label={skill.title}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 text-[var(--color-text-primary)] transition-all duration-500 ease-out hover:border-black/10 hover:shadow-xl hover:shadow-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10 dark:hover:border-white/15 dark:focus-visible:ring-white/15 sm:p-5 hover:-translate-y-1 min-h-[280px]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] ${categoryTheme}`}
          >
            {skill.category}
          </span>
        </div>

        <div
          className="inline-flex max-w-[48%] shrink-0 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-2.5 py-1.5 text-xs text-[var(--color-text-primary)]"
          aria-label={labels.author}
          title={labels.author}
        >
          <Avatar name={skill.author.name} src={skill.author.avatar} compact />
          <span className="truncate font-medium">{skill.author.name}</span>
        </div>
      </div>

      <h3 className="mt-5 text-[1.5rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[var(--color-text-primary)]">
        {skill.title}
      </h3>

      <p className="mt-3 line-clamp-2 text-[15px] leading-7 text-[var(--color-text-secondary)]">
        {skill.description || "可复用的研究技能，帮助你提升工作效率。"}
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
            {formatCount(skill.viewCount)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5" />
            {formatCount(skill.likeCount)}
          </span>
        </div>
      </div>
    </article>
  );
}