"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PromptShowcaseCard from "./PromptShowcaseCard";

const AUTO_INTERVAL = 5000;
const SLIDE_DURATION = 600;
const PEEK = 64; // px of adjacent card visible on each side
const GAP = 20; // px between cards

interface FeaturedPrompt {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  category: string;
  tags: string[];
  likeCount: number;
  downloadCount: number;
  authorId: string;
  createdAt: string;
  author: { id: string; name: string; avatar: string | null };
}

interface FeaturedCarouselLabels {
  author: string;
  code: string;
  preview: string;
  featured: string;
  prompt: string;
  copy: string;
  copied: string;
}

export default function FeaturedCarousel({
  prompts,
  labels,
}: {
  prompts: FeaturedPrompt[];
  labels: FeaturedCarouselLabels;
}) {
  const total = prompts.length;
  const hasLoop = total > 1;

  // Extended slides: [clone-last, ...real, clone-first] for seamless loop
  const slides = hasLoop
    ? [prompts[total - 1], ...prompts, prompts[0]]
    : prompts;

  // pos tracks index in the extended array; real slides sit at 1..total
  const [pos, setPos] = useState(hasLoop ? 1 : 0);
  const [animate, setAnimate] = useState(true);
  const [hovered, setHovered] = useState(false);
  const hoverLock = useRef(false);
  const lockTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cw, setCw] = useState(0);
  const measureWidth = useCallback(() => {
    const nextWidth = containerRef.current?.getBoundingClientRect().width ?? 0;

    setCw((prev) => {
      if (Math.abs(prev - nextWidth) < 0.5) {
        return prev;
      }

      return nextWidth;
    });
  }, []);

  // Real index (0..total-1) for dots
  const realIndex = hasLoop ? ((pos - 1) % total + total) % total : pos;

  /* ── measure container ── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    measureWidth();

    const ro = new ResizeObserver(() => measureWidth());
    const handlePageRestore = () => {
      requestAnimationFrame(measureWidth);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        requestAnimationFrame(measureWidth);
      }
    };

    ro.observe(el);
    window.addEventListener("resize", measureWidth);
    window.addEventListener("pageshow", handlePageRestore);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measureWidth);
      window.removeEventListener("pageshow", handlePageRestore);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [measureWidth]);

  /* ── snap back from clone to real position (no animation) ── */
  const handleTransitionEnd = useCallback(() => {
    if (!hasLoop) return;
    if (pos === 0) {
      setAnimate(false);
      setPos(total);
    } else if (pos === total + 1) {
      setAnimate(false);
      setPos(1);
    }
  }, [pos, total, hasLoop]);

  // Re-enable animation after the instant snap renders
  useEffect(() => {
    if (!animate) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimate(true));
      });
    }
  }, [animate]);

  /* ── auto-rotation ── */
  const resetTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setPos((prev) => prev + 1);
    }, AUTO_INTERVAL);
  }, []);

  useEffect(() => {
    if (hovered) {
      clearInterval(timerRef.current);
    } else {
      resetTimer();
    }
    return () => clearInterval(timerRef.current);
  }, [resetTimer, hovered]);

  /* ── navigate to a real index (for dots) ── */
  const goTo = (realIdx: number) => {
    setAnimate(true);
    setPos(hasLoop ? realIdx + 1 : realIdx);
    resetTimer();
  };

  if (total < 1) return null;

  /* ── layout math ── */
  const cardWidth = cw > 2 * PEEK ? cw - 2 * PEEK : 0;
  const stride = cardWidth + GAP;
  const offset = PEEK - pos * stride;

  return (
    <div
      className="relative"
      ref={containerRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="overflow-hidden">
        <div
          className="flex"
          onTransitionEnd={handleTransitionEnd}
          style={{
            gap: `${GAP}px`,
            transform: cw > 0 ? `translateX(${offset}px)` : undefined,
            transition: animate ? `transform ${SLIDE_DURATION}ms ease` : "none",
          }}
        >
          {slides.map((prompt, i) => {
            const isActive = i === pos;
            return (
              <div
                key={`${prompt.id}-${i}`}
                className={`shrink-0 ${animate ? "transition-[opacity,transform] duration-500" : ""}`}
                style={{
                  width: cw > 0 ? `${cardWidth}px` : "100%",
                  opacity: isActive ? 1 : 0.45,
                  transform: isActive ? "scale(1)" : "scale(0.97)",
                  cursor: !isActive ? "pointer" : undefined,
                }}
                onMouseEnter={() => {
                  if (!isActive && !hoverLock.current) {
                    hoverLock.current = true;
                    clearTimeout(lockTimer.current);
                    lockTimer.current = setTimeout(() => {
                      hoverLock.current = false;
                    }, SLIDE_DURATION + 300);
                    setPos(i);
                  }
                }}
              >
                <PromptShowcaseCard
                  prompt={prompt}
                  isFeatured
                  noHoverLift
                  labels={labels}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Dots */}
      {total > 1 && (
        <div className="mt-4 flex items-center justify-center gap-[6px]">
          {prompts.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Show slide ${i + 1} of ${total}`}
              className="rounded-full transition-all duration-300"
              style={{
                width: realIndex === i ? 24 : 8,
                height: 8,
                backgroundColor:
                  realIndex === i
                    ? "var(--color-text-primary)"
                    : "var(--color-text-secondary)",
                opacity: realIndex === i ? 1 : 0.35,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
