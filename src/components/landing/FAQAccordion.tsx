"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Reveal from "@/components/shared/Reveal";
import { getHomeContent } from "./content";

export default function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(0);
  const locale = useLocale();
  const content = getHomeContent(locale);

  return (
    <section id="faq" className="bg-black py-32">
      <div className="mx-auto max-w-[1440px] px-6">
        <div className="grid grid-cols-1 gap-24 lg:grid-cols-2">
          <Reveal direction="up" threshold={0.22}>
            <div>
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em]">
              {content.faq.eyebrow}
            </div>
            <h2 className="mb-10 text-5xl font-semibold leading-[0.9] tracking-[-0.04em] md:text-[80px]">
              {content.faq.title[0]}
              <br />
              <span className="text-white/30">{content.faq.title[1]}</span>
            </h2>
            <p className="mb-12 max-w-md text-lg font-medium leading-relaxed text-white/40 md:text-[20px]">
              {content.faq.description}
            </p>
            <a
              href="https://github.com/dwdecon/EconAgora"
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-full border border-white/10 bg-white/5 px-10 py-5 text-[15px] font-bold transition-all hover:bg-white hover:text-black"
            >
              {content.faq.action}
            </a>
            </div>
          </Reveal>

          <div className="space-y-4">
            {content.faq.items.map((faq, index) => (
              <Reveal
                key={faq.question}
                direction="up"
                delay={index * 120}
                threshold={0.2}
              >
                <div
                  className="overflow-hidden rounded-[32px] border border-white/8 bg-white/[0.03] backdrop-blur-2xl"
                >
                  <button
                    className="group flex w-full items-center justify-between p-8 text-left"
                    onClick={() => setOpen(open === index ? null : index)}
                  >
                    <span className="text-xl font-semibold tracking-tight md:text-2xl">
                      {faq.question}
                    </span>
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/10 transition-all ${
                        open === index
                          ? "rotate-45 bg-white text-black"
                          : "group-hover:border-white/30"
                      }`}
                    >
                      +
                    </div>
                  </button>
                  {open === index && (
                    <div className="px-8 pb-8 text-lg leading-relaxed text-white/40">
                      {faq.answer}
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
