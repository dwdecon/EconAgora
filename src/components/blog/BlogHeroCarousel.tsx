"use client";

import { useState, useEffect } from "react";
import BlogBookCard from "./BlogBookCard";
import type { LocalizedBlogEntry } from "@/lib/blog";

export default function BlogHeroCarousel({
  entries,
  interval = 5000,
}: {
  entries: LocalizedBlogEntry[];
  interval?: number;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (entries.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % entries.length);
    }, interval);

    return () => clearInterval(timer);
  }, [entries.length, interval]);

  if (!entries.length) return null;

  return (
    <div className="relative h-[460px] w-full max-w-[340px] mx-auto perspective-1000">
      {entries.map((entry, index) => {
        // Determine position relative to current index
        let position = index - currentIndex;
        
        // Handle wrapping for smooth continuous loop visual
        // If we are at the end looking at the first, or at the start looking at the last
        if (position < -1) position += entries.length;
        if (position > 1) position -= entries.length;

        // Calculate styles based on position
        const isActive = position === 0;
        const isPrev = position === -1;
        const isNext = position === 1;

        // Only render visible items to save DOM nodes
        if (!isActive && !isPrev && !isNext && entries.length > 3) {
            return null;
        }

        let transform = "translateX(0) scale(1)";
        let opacity = 0;
        let zIndex = 0;

        if (isActive) {
          transform = "translateX(0) scale(1) translateZ(0)";
          opacity = 1;
          zIndex = 20;
        } else if (isNext) {
          transform = "translateX(20%) scale(0.9) translateZ(-100px) rotateY(-5deg)";
          opacity = 0; // Hide others for a cleaner 1-by-1 look, or set to 0.4 for a stack look
          zIndex = 10;
        } else if (isPrev) {
          transform = "translateX(-20%) scale(0.9) translateZ(-100px) rotateY(5deg)";
          opacity = 0;
          zIndex = 10;
        }

        return (
          <div
            key={entry.slug}
            className="absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={{
              transform,
              opacity,
              zIndex,
              pointerEvents: isActive ? "auto" : "none",
            }}
          >
            <BlogBookCard article={entry} heightClass="h-full" />
          </div>
        );
      })}

      {/* Navigation dots */}
      <div className="absolute -bottom-8 left-0 right-0 flex justify-center gap-2">
        {entries.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "w-6 bg-[var(--color-primary)]"
                : "w-1.5 bg-[var(--color-border-hover)]"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
