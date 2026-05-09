"use client";

import Image from "next/image";
import { Code2, Eye, Heart } from "lucide-react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
} from "react";
import CopyPromptButton from "./CopyPromptButton";
import { getPromptCategoryTheme } from "./categoryTheme";
import { useRouter } from "@/i18n/navigation";
import TagBadge from "@/components/shared/TagBadge";

const DEFAULT_DESCRIPTION = "Structured prompt system for rigorous research workflows.";
const DEFAULT_SNIPPET = [
  "Role: Research copilot",
  "Goal: Turn source notes into a clear, defensible output",
  "",
  "Inputs:",
  "- topic",
  "- evidence set",
  "- output constraints",
].join("\n");

interface PromptShowcaseCardProps {
  prompt: {
    id: string;
    title: string;
    description: string | null;
    content: string | null;
    category: string;
    tags: string[];
    likeCount: number;
    viewCount: number;
    createdAt: string;
    author: { id: string; name: string; avatar: string | null };
  };
  labels: {
    author: string;
    code: string;
    preview: string;
    featured: string;
    prompt: string;
    copy: string;
    copied: string;
  };
  isFeatured?: boolean;
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
  const imageSize = compact ? 28 : 40;

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={imageSize}
        height={imageSize}
        unoptimized
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

function getSnippet(content: string | null) {
  const normalized = content?.replace(/\r\n/g, "\n").trim();

  if (!normalized) {
    return DEFAULT_SNIPPET;
  }

  const compactLines = normalized
    .split("\n")
    .map((line) => line.trimEnd())
    .reduce<string[]>((lines, line) => {
      if (line.length === 0 && lines[lines.length - 1] === "") {
        return lines;
      }

      lines.push(line);
      return lines;
    }, []);

  return compactLines.join("\n");
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    notation: value >= 1000 ? "compact" : "standard",
  }).format(value);
}

function shouldSkipNavigation(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest("[data-prevent-navigation='true']"));
}

export default function PromptShowcaseCard({
  prompt,
  labels,
  isFeatured,
}: PromptShowcaseCardProps) {
  const router = useRouter();
  const categoryTheme = getPromptCategoryTheme(prompt.category);
  const metaTags = prompt.tags.filter((tag) => tag !== prompt.category).slice(0, isFeatured ? 3 : 2);
  const snippet = getSnippet(prompt.content);
  const copyContent = prompt.content?.trim() ? prompt.content : snippet;

  function navigateToDetail() {
    router.push(`/prompts/${prompt.id}`);
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
      aria-label={prompt.title}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 text-[var(--color-text-primary)] transition-all duration-300 ease-out hover:border-[var(--color-border-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-hover)] dark:focus-visible:ring-white/15 sm:p-6 break-inside-avoid"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] ${categoryTheme}`}
          >
            {prompt.category}
          </span>
        </div>

        <div
          className="inline-flex max-w-[48%] shrink-0 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-2.5 py-1.5 text-xs text-[var(--color-text-secondary)]"
          aria-label={labels.author}
          title={labels.author}
        >
          <Avatar name={prompt.author.name} src={prompt.author.avatar} compact />
          <span className="truncate font-medium">{prompt.author.name}</span>
        </div>
      </div>

      <h3
        className={`mt-5 font-normal text-[var(--color-text-primary)] ${
          isFeatured ? "text-[1.5rem] leading-[1.2] sm:text-[1.75rem]" : "text-[1.25rem] leading-[1.25]"
        }`}
      >
        {prompt.title}
      </h3>

      <p className="mt-4 line-clamp-3 text-[14px] leading-[1.5] text-[var(--color-text-secondary)]">
        {prompt.description || DEFAULT_DESCRIPTION}
      </p>

      <div
        data-prevent-navigation="true"
        className={`mt-5 flex w-full min-w-0 flex-none flex-col overflow-hidden rounded-[8px] border border-[var(--color-border)] bg-[var(--color-bg-surface)] ${
          isFeatured ? "h-[280px] sm:h-[320px]" : "h-[220px] sm:h-[240px]"
        }`}
        aria-label={labels.code}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-3 py-2.5">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-border)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-border)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-border)]" />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <CopyPromptButton
              content={copyContent}
              copyLabel={labels.copy}
              copiedLabel={labels.copied}
              className="shrink-0"
            />
            <Code2 className="h-4 w-4 text-[var(--color-text-secondary)]" />
          </div>
        </div>

        <pre className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3.5 py-3.5 text-[13px] leading-6 text-[var(--color-text-secondary)]">
          <code className="font-mono whitespace-pre-wrap break-words">{snippet}</code>
        </pre>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4 pt-6">
        <div className="flex flex-wrap gap-2">
          {metaTags.map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-3 text-xs font-medium text-[var(--color-text-secondary)]">
          <span className="inline-flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5" />
            {formatCount(prompt.likeCount)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            {formatCount(prompt.viewCount)}
          </span>
        </div>
      </div>
    </article>
  );
}
