"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, Heart, ExternalLink } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import type { Tool } from "@/lib/tools";

const AUTO_INTERVAL = 5000;
const SLIDE_DURATION = 600;
const PEEK = 64;
const GAP = 20;

interface ToolCarouselLabels {
  author: string;
  views: string;
  likes: string;
}

interface ToolCarouselProps {
  tools: Tool[];
  labels: ToolCarouselLabels;
}

const CATEGORY_THEME: Record<string, string> = {
  "AI Assistant": "border-purple-200/70 bg-purple-50/80 text-purple-700",
  "Reference Management": "border-blue-200/70 bg-blue-50/80 text-blue-700",
  Writing: "border-emerald-200/70 bg-emerald-50/80 text-emerald-700",
  Visualization: "border-amber-200/70 bg-amber-50/80 text-amber-700",
  "Data Analysis": "border-sky-200/70 bg-sky-50/80 text-sky-700",
  Default:
    "border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)]",
};

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    notation: value >= 1000 ? "compact" : "standard",
  }).format(value);
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

function ToolCarouselCard({
  tool,
  labels,
  onClick,
}: {
  tool: Tool;
  labels: ToolCarouselLabels;
  onClick: () => void;
}) {
  const categoryTheme = CATEGORY_THEME[tool.category] || CATEGORY_THEME.Default;
  const metaTags = tool.tags.filter((tag) => tag !== tool.category).slice(0, 3);

  return (
    <article
      onClick={onClick}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 text-[var(--color-text-primary)] transition-all duration-500 ease-out hover:border-black/10 hover:shadow-xl hover:shadow-black/5 sm:p-5 min-h-[340px]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] ${categoryTheme}`}
          >
            {tool.category}
          </span>
          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
            Featured
          </span>
        </div>

        <div className="flex items-center gap-2">
          {tool.officialUrl && (
            <a
              href={tool.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-2 text-[var(--color-text-secondary)] hover:text-primary transition"
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

      <h3 className="mt-5 text-[1.8rem] font-semibold leading-[1.1] tracking-[-0.02em] text-[var(--color-text-primary)]">
        {tool.title}
      </h3>

      <p className="mt-4 line-clamp-2 text-[15px] leading-7 text-[var(--color-text-secondary)]">
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

export default function ToolCarousel({ tools, labels }: ToolCarouselProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const navigateToDetail = useCallback(
    (id: string) => {
      router.push(`/tools/${id}`);
    },
    [router],
  );

  const scrollToIndex = useCallback(
    (newIndex: number) => {
      if (!containerRef.current || isTransitioning) return;

      setIsTransitioning(true);
      const container = containerRef.current;
      const card = container.querySelector("[data-tool-card]");
      if (!card) return;

      const cardWidth = card.getBoundingClientRect().width;
      const scrollPosition = newIndex * (cardWidth + GAP);

      container.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });

      setTimeout(() => {
        setIsTransitioning(false);
      }, SLIDE_DURATION);
    },
    [isTransitioning],
  );

  useEffect(() => {
    if (isPaused || tools.length <= 1) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % tools.length);
      scrollToIndex((index + 1) % tools.length);
    }, AUTO_INTERVAL);

    return () => clearInterval(timer);
  }, [isPaused, tools.length, index, scrollToIndex]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const card = container.querySelector("[data-tool-card]");
      if (!card) return;

      const cardWidth = card.getBoundingClientRect().width;
      const scrollLeft = container.scrollLeft;
      const newIndex = Math.round(scrollLeft / (cardWidth + GAP));

      if (newIndex !== index && newIndex >= 0 && newIndex < tools.length) {
        setIndex(newIndex);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [index, tools.length]);

  if (tools.length === 0) return null;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        ref={containerRef}
        className="flex overflow-x-auto scrollbar-hide scroll-smooth"
        style={{
          scrollSnapType: "x mandatory",
          scrollPaddingInline: `${PEEK}px`,
          gap: `${GAP}px`,
          paddingLeft: `${PEEK}px`,
          paddingRight: `${PEEK}px`,
        }}
      >
        {tools.map((tool) => (
          <div
            key={tool.id}
            data-tool-card
            className="flex-shrink-0"
            style={{
              scrollSnapAlign: "center",
              width: `calc(100% - ${PEEK * 2}px)`,
            }}
          >
            <ToolCarouselCard
              tool={tool}
              labels={labels}
              onClick={() => navigateToDetail(tool.id)}
            />
          </div>
        ))}
      </div>

      {tools.length > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {tools.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setIndex(i);
                scrollToIndex(i);
              }}
              className={`h-2 w-2 rounded-full transition-all ${
                i === index
                  ? "bg-primary w-6"
                  : "bg-[var(--color-border)] hover:bg-[var(--color-text-muted)]"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}