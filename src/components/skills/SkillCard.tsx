"use client";

import { Eye, Heart } from "lucide-react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
} from "react";
import { useRouter } from "@/i18n/navigation";
import type { Skill } from "@/lib/skills";
import { getCategoryTheme } from "@/lib/category-theme";

interface SkillCardProps {
  skill: Skill;
  locale: string;
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

export default function SkillCard({ skill, locale, labels }: SkillCardProps) {
  const router = useRouter();
  const categoryTheme = getCategoryTheme(skill.category);
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
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 text-[var(--color-text-primary)] transition-all duration-300 ease-out hover:border-[var(--color-border-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-hover)] dark:focus-visible:ring-white/15 sm:p-6 min-h-[280px]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] ${categoryTheme}`}
          >
            {skill.category}
          </span>
        </div>
      </div>

      <h3 className="mt-5 text-[1.25rem] font-normal leading-[1.25] text-[var(--color-text-primary)]">
        {skill.title}
      </h3>
      {locale === "zh" && skill.titleZh && (
        <p className="mt-1 text-[13px] leading-[1.3] text-[var(--color-text-secondary)]">
          {skill.titleZh}
        </p>
      )}

      <p className="mt-3 text-[14px] text-[var(--color-text-secondary)] break-words">
        {labels.author}: {skill.author.name}
      </p>

      <p className="mt-3 line-clamp-2 text-[14px] leading-[1.5] text-[var(--color-text-secondary)]">
        {(locale === "zh" && skill.descriptionZh ? skill.descriptionZh : skill.description) || "可复用的研究技能，帮助你提升工作效率。"}
      </p>

      <div className="mt-auto flex items-end justify-between gap-4 pt-6">
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
            {labels.views} {formatCount(skill.viewCount)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5" />
            {labels.likes} {formatCount(skill.likeCount)}
          </span>
        </div>
      </div>
    </article>
  );
}
