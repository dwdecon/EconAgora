"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Reveal from "@/components/shared/Reveal";
import { getHomeContent } from "./content";

function FAQArrow({ isOpen }: { isOpen: boolean }) {
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300"
      style={{
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: isOpen ? "#F25325" : "rgba(255,255,255,0.1)",
        backgroundColor: isOpen ? "#F25325" : "transparent",
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        style={{
          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 300ms ease",
          filter: isOpen ? "brightness(200%)" : "none",
        }}
      >
        <path
          d="M4 6L8 10L12 6"
          stroke={isOpen ? "#fff" : "rgba(255,255,255,0.4)"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(0);
  const locale = useLocale();
  const content = getHomeContent(locale);

  return (
    <section id="faq" className="bg-black py-24">
      <div className="mx-auto max-w-[1440px] px-6">
        <div className="grid grid-cols-1 gap-24 lg:grid-cols-2">
          {/* Left */}
          <Reveal direction="up" threshold={0.22}>
            <div>
              <h2 className="mb-10 text-[36px] font-semibold tracking-[-0.03em] sm:text-[44px] md:text-[52px]">
                <div className="leading-[1.05]">{content.faq.title[0]}</div>
                {content.faq.title[1] && (
                  <div className="mt-3 leading-[1.1] text-white/30">
                    {content.faq.title[1]}
                  </div>
                )}
              </h2>
              <p className="mb-12 max-w-md text-lg leading-relaxed text-white/40 md:text-[20px]">
                {content.faq.description}
              </p>
              <button
                type="button"
                id="ai-assistant-trigger"
                className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-10 py-5 text-[15px] font-bold transition-all hover:bg-white hover:text-black"
                onClick={() => {
                  /* TODO: 接入网站 AI 助手 */
                  window.alert("AI 助手功能即将上线，敬请期待！");
                }}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 8V4H8" /><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M2 12h20" /><path d="M12 2v20" /><circle cx="7" cy="7" r="1" fill="currentColor" /><circle cx="17" cy="7" r="1" fill="currentColor" />
                </svg>
                {content.faq.action}
              </button>
            </div>
          </Reveal>

          {/* Right */}
          <div className="space-y-3">
            {content.faq.items.map((faq, index) => {
              const isOpen = open === index;
              return (
                <Reveal
                  key={faq.question}
                  direction="up"
                  delay={index * 120}
                  threshold={0.2}
                >
                  <div
                    className="transition-all duration-300"
                    style={{
                      padding: "20px 24px",
                      borderBottomWidth: isOpen ? 4 : 0,
                      borderBottomStyle: "solid",
                      borderBottomColor: "#F25325",
                      backgroundColor: "#000",
                    }}
                  >
                    <button
                      className="flex w-full items-center justify-between text-left"
                      onClick={() => setOpen(isOpen ? null : index)}
                    >
                      <span className="flex-1 pr-4 text-xl font-semibold text-white md:text-2xl">
                        {faq.question}
                      </span>
                      <FAQArrow isOpen={isOpen} />
                    </button>

                    {/* Answer — smooth gridTemplateRows animation */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateRows: isOpen ? "1fr" : "0fr",
                        transition: "grid-template-rows 300ms ease",
                      }}
                    >
                      <div className="overflow-hidden">
                        <p className="pt-5 text-lg leading-relaxed text-white/40">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
