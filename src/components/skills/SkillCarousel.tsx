"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, Heart } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import type { Skill } from "@/lib/skills";

const AUTO_INTERVAL = 5000;
const SLIDE_DURATION = 600;
const PEEK = 64;
const GAP = 20;

interface SkillCarouselLabels {
  author: string;
  views: string;
  likes: string;
}

interface SkillCarouselProps {
  skills: Skill[];
  labels: SkillCarouselLabels;
}

const CATEGORY_THEME: Record<string, string> = {
  "Data Analysis": "border-sky-200/70 bg-sky-50/80 text-sky-700",
  Visualization: "border-emerald-200/70 bg-emerald-50/80 text-emerald-700",
  Writing: "border-violet-200/70 bg-violet-50/80 text-violet-700",
  Automation: "border-amber-200/70 bg-amber-50/80 text-amber-700",
  "API Integration": "border-rose-200/70 bg-rose-50/80 text-rose-700",
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
  const size = compact ? 28 : 40;

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
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

function SkillCarouselCard({
  skill,
  labels,
  onClick,
}: {
  skill: Skill;
  labels: SkillCarouselLabels;
  onClick: () => void;
}) {
  const categoryTheme =
    CATEGORY_THEME[skill.category] || CATEGORY_THEME.Default;
  const metaTags = skill.tags.filter((tag) => tag !== skill.category).slice(0, 3);

  return (
    <article
      onClick={onClick}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[16px] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 text-[var(--color-text-primary)] transition-colors duration-300 ease-out hover:border-[var(--color-border-hover)] sm:p-6 min-h-[340px]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] ${categoryTheme}`}
          >
            {skill.category}
          </span>
          <span className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface-strong)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
            Featured
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

      <h3 className="mt-5 text-[1.8rem] font-normal leading-[1.1] tracking-normal text-[var(--color-text-primary)]">
        {skill.title}
      </h3>

      <p className="mt-4 line-clamp-2 text-[15px] leading-7 text-[var(--color-text-secondary)] font-normal">
        {skill.description || "可复用的研究技能，帮助你提升工作效率。"}
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

export default function SkillCarousel({ skills, labels }: SkillCarouselProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const navigateToDetail = useCallback(
    (id: string) => {
      router.push(`/skills/${id}`);
    },
    [router],
  );

  const scrollToIndex = useCallback((newIndex: number) => {
    if (!containerRef.current || isTransitioning) return;

    setIsTransitioning(true);
    const container = containerRef.current;
    const card = container.querySelector("[data-skill-card]");
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
  }, [isTransitioning]);

  useEffect(() => {
    if (isPaused || skills.length <= 1) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % skills.length);
      scrollToIndex((index + 1) % skills.length);
    }, AUTO_INTERVAL);

    return () => clearInterval(timer);
  }, [isPaused, skills.length, index, scrollToIndex]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const card = container.querySelector("[data-skill-card]");
      if (!card) return;

      const cardWidth = card.getBoundingClientRect().width;
      const scrollLeft = container.scrollLeft;
      const newIndex = Math.round(scrollLeft / (cardWidth + GAP));

      if (newIndex !== index && newIndex >= 0 && newIndex < skills.length) {
        setIndex(newIndex);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [index, skills.length]);

  if (skills.length === 0) return null;

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
        {skills.map((skill) => (
          <div
            key={skill.id}
            data-skill-card
            className="flex-shrink-0"
            style={{
              scrollSnapAlign: "center",
              width: `calc(100% - ${PEEK * 2}px)`,
            }}
          >
            <SkillCarouselCard
              skill={skill}
              labels={labels}
              onClick={() => navigateToDetail(skill.id)}
            />
          </div>
        ))}
      </div>

      {skills.length > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {skills.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setIndex(i);
                scrollToIndex(i);
              }}
              className={`h-2 w-2 rounded-full transition-all ${
                i === index
                  ? "bg-[var(--color-text-primary)] w-6"
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
