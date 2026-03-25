"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Star } from "lucide-react";
import Reveal from "@/components/shared/Reveal";
import { getHomeContent } from "./content";

const AUTO_INTERVAL = 6000;
const SLIDE_DURATION = 500;

export default function Testimonials() {
  const locale = useLocale();
  const content = getHomeContent(locale);
  const { testimonials } = content;
  const total = testimonials.items.length;

  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const resetTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % total);
    }, AUTO_INTERVAL);
  }, [total]);

  useEffect(() => {
    resetTimer();
    return () => clearInterval(timerRef.current);
  }, [resetTimer]);

  const goTo = (i: number) => {
    setActive(i);
    resetTimer();
  };

  return (
    <section className="relative bg-black py-24">
      <div className="mx-auto max-w-[1120px] px-6 md:px-10">
        {/* ── Header ── */}
        <Reveal direction="up" threshold={0.25}>
          <div className="mb-16 text-center">
            <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5">
              <Star size={13} className="text-white/60" fill="currentColor" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/50">
                testimonial
              </span>
            </div>
            <h2 className="text-[36px] font-semibold leading-[1.12] tracking-[-0.03em] text-white sm:text-[44px] md:text-[52px]">
              {testimonials.title[0]} {testimonials.title[1]}
            </h2>
            <p className="mx-auto mt-5 max-w-[480px] text-[16px] leading-[1.7] text-white/40">
              {testimonials.subtitle}
            </p>
          </div>
        </Reveal>

        {/* ── Slider ── */}
        <Reveal direction="up" delay={100} threshold={0.15}>
          <div className="relative">
            <div className="overflow-hidden rounded-[24px]">
              <div
                className="flex"
                style={{
                  transform: `translateX(-${active * 100}%)`,
                  transition: `transform ${SLIDE_DURATION}ms ease`,
                }}
              >
                {testimonials.items.map((item, i) => (
                  <div key={i} className="w-full shrink-0">
                    <div className="flex flex-col bg-[#141414] md:flex-row md:items-stretch">
                      {/* Left: Photo area */}
                      <div className="relative shrink-0 md:w-[380px]">
                        {/* Gray avatar area */}
                        <div className="relative h-[320px] overflow-hidden bg-[#2a2a2a] md:h-full">
                          {/* Initials as large avatar placeholder */}
                          <div className="flex h-full w-full items-center justify-center">
                            <span className="text-[80px] font-bold text-white/10">
                              {item.initials}
                            </span>
                          </div>
                        </div>
                        {/* Stat badge — white card overlapping bottom-right */}
                        <div className="absolute bottom-5 right-[-12px] z-10 rounded-2xl bg-white px-6 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                          <div className="font-mono text-[22px] font-bold leading-tight text-[#ff5a00]">
                            {item.statValue}
                          </div>
                          <div className="mt-0.5 text-[12px] font-medium text-[#333]">
                            {item.statLabel}
                          </div>
                        </div>
                      </div>

                      {/* Right: Quote + user */}
                      <div className="flex flex-1 flex-col justify-between p-8 md:p-12">
                        <p className="text-[22px] font-semibold leading-[1.5] tracking-[-0.01em] text-white md:text-[26px]">
                          &ldquo;{item.quote}&rdquo;
                        </p>
                        <div className="mt-10 flex items-end justify-between">
                          <div>
                            <div className="text-[16px] font-semibold text-white">
                              {item.author}
                            </div>
                            <div className="mt-0.5 text-[14px] text-white/40">
                              {item.role}
                            </div>
                          </div>
                          {/* Small accent circle */}
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#ff5a00] to-[#ff2d55]">
                            <div className="h-4 w-4 rounded-full bg-white/30" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Left/right fade overlays */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-black to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-black to-transparent" />
          </div>

          {/* ── Dots ── */}
          <div className="mt-10 flex items-center justify-center gap-[6px]">
            {testimonials.items.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Show slide ${i + 1} of ${total}`}
                className="rounded-full transition-all duration-300"
                style={{
                  width: active === i ? 24 : 8,
                  height: 8,
                  backgroundColor:
                    active === i ? "#fff" : "rgba(255,255,255,0.35)",
                }}
              />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
