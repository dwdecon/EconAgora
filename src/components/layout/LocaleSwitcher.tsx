"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";

const LOCALES = [
  { code: "zh", label: "中文" },
  { code: "en", label: "English" },
] as const;

export default function LocaleSwitcher({ isHome = false }: { isHome?: boolean }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  function switchTo(code: string) {
    router.push(pathname, { locale: code });
    setOpen(false);
  }

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Switch language"
        className={`inline-flex items-center justify-center rounded-full border p-2.5 transition-all duration-300 ${
          isHome
            ? "border-white/10 text-white/80 hover:border-white/30 hover:bg-white/5 hover:text-white"
            : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface)] hover:text-[var(--color-text-primary)]"
        }`}
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      </button>

      {/* Dropdown */}
      <div
        className={`absolute right-0 mt-3 min-w-[140px] origin-top-right overflow-hidden rounded-2xl border shadow-[0_16px_48px_rgba(0,0,0,0.15)] backdrop-blur-2xl ${
          isHome
            ? "border-white/[0.08] bg-[#111113]/90 shadow-[0_16px_48px_rgba(0,0,0,0.6)]"
            : "border-[var(--color-border)] bg-[var(--color-bg-card)]"
        }`}
        style={{
          opacity: open ? 1 : 0,
          filter: open ? "blur(0px)" : "blur(4px)",
          transform: open
            ? "scale(1) translateY(0)"
            : "scale(0.9) translateY(-8px)",
          transition:
            "opacity 300ms cubic-bezier(0.16, 1, 0.3, 1), filter 300ms cubic-bezier(0.16, 1, 0.3, 1), transform 300ms cubic-bezier(0.16, 1, 0.3, 1)",
          pointerEvents: open ? "auto" : "none",
        }}
      >
        <div className="p-1.5">
          {LOCALES.map(({ code, label }, i) => (
            <button
              key={code}
              onClick={() => switchTo(code)}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                locale === code
                  ? isHome
                    ? "bg-white/[0.08] text-white"
                    : "bg-[var(--color-bg-surface-strong)] text-[var(--color-text-primary)]"
                  : isHome
                    ? "text-white/40 hover:bg-white/[0.04] hover:text-white/70"
                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface)] hover:text-[var(--color-text-primary)]"
              }`}
              style={{
                opacity: open ? 1 : 0,
                transform: open ? "translateY(0)" : "translateY(-6px)",
                transition: `opacity 300ms cubic-bezier(0.16, 1, 0.3, 1) ${i * 50 + 80}ms, transform 300ms cubic-bezier(0.16, 1, 0.3, 1) ${i * 50 + 80}ms`,
              }}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                  locale === code
                    ? "bg-[#ff5a00] shadow-[0_0_6px_rgba(255,90,0,0.4)]"
                    : isHome ? "bg-white/10" : "bg-[var(--color-text-muted)]"
                }`}
              />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
