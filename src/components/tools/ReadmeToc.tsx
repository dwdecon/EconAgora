"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TocItem } from "@/lib/readme";

interface ReadmeTocProps {
  items: TocItem[];
  label: string;
}

export default function ReadmeToc({ items, label }: ReadmeTocProps) {
  const [activeSlug, setActiveSlug] = useState<string>("");
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0) {
          setActiveSlug(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    items.forEach((item) => {
      const el = document.getElementById(item.slug);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const handleClick = (slug: string) => {
    const el = document.getElementById(slug);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const handleMouseEnter = useCallback((item: TocItem, btn: HTMLButtonElement) => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    const rect = btn.getBoundingClientRect();
    setTooltip({
      text: item.text,
      x: rect.right + 6,
      y: rect.top,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    hideTimerRef.current = setTimeout(() => setTooltip(null), 100);
  }, []);

  if (items.length === 0) return null;

  return (
    <nav className="sticky top-24">
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-3 px-2">
        {label}
      </h3>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li
            key={item.slug}
            className={item.level === 3 ? "pl-2.5" : ""}
          >
            <button
              onClick={() => handleClick(item.slug)}
              onMouseEnter={(e) => handleMouseEnter(item, e.currentTarget)}
              onMouseLeave={handleMouseLeave}
              className={`text-left text-[11px] leading-snug w-full py-1 px-2 rounded-md transition-colors truncate ${
                activeSlug === item.slug
                  ? "text-[var(--color-text-primary)] bg-[var(--color-bg-surface-strong)]"
                  : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
              }`}
            >
              {item.text}
            </button>
          </li>
        ))}
      </ul>

      {mounted && tooltip &&
        createPortal(
          <div
            style={{
              position: "fixed",
              left: tooltip.x,
              top: tooltip.y,
              zIndex: 2147483647,
              maxWidth: 280,
              padding: "4px 8px",
              borderRadius: 6,
              fontSize: 11,
              lineHeight: 1.4,
              background: "#ffffff",
              border: "1px solid var(--color-border)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              color: "var(--color-text-secondary)",
              pointerEvents: "none",
              whiteSpace: "normal",
              wordBreak: "break-word",
            }}
          >
            {tooltip.text}
          </div>,
          document.body,
        )}
    </nav>
  );
}
