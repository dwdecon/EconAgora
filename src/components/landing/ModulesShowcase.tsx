"use client";

import { useState } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import Reveal from "@/components/shared/Reveal";
import { getHomeContent, localizeHref } from "./content";

const GRADIENTS = [
  "from-[#ff5a00]/20 to-[#ff2d55]/10",
  "from-[#146ef5]/20 to-[#00d18f]/10",
  "from-[#f51ce6]/20 to-[#146ef5]/10",
  "from-[#00d18f]/20 to-[#ff5a00]/10",
  "from-[#ff2d55]/20 to-[#f51ce6]/10",
  "from-[#146ef5]/20 to-[#ff5a00]/10",
  "from-[#f51ce6]/20 to-[#00d18f]/10",
  "from-[#ff5a00]/20 to-[#146ef5]/10",
  "from-[#00d18f]/20 to-[#f51ce6]/10",
  "from-[#ff2d55]/20 to-[#146ef5]/10",
];

export default function ModulesShowcase({ locale }: { locale: string }) {
  const content = getHomeContent(locale);
  const tabs = content.modules.tabs;
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section id="modules" className="relative bg-black py-24">
      <div className="pointer-events-none absolute left-1/2 top-[44%] h-[720px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(255,90,0,0.14),_rgba(255,20,83,0.12)_38%,_rgba(0,209,255,0.06)_60%,_transparent_74%)] blur-[130px]" />

      <div className="mx-auto max-w-[1280px] px-6 md:px-10">
        {/* Header */}
        <Reveal direction="up" threshold={0.25}>
          <div className="mb-16 flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                <div className="mr-1 h-1.5 w-1.5 rotate-45 bg-[#ff5a00]" />
                {content.modules.eyebrow}
              </div>
              <h2 className="text-[36px] font-semibold leading-[1.08] tracking-[-0.03em] text-white sm:text-[44px] md:text-[52px]">
                {content.modules.title[0]}
              </h2>
            </div>
            <div className="mt-6 max-w-[420px]">
              <p className="mb-4 text-[15px] leading-[1.7] text-[#A1A1AA]">
                {content.modules.description}
              </p>
              <a
                href={localizeHref(locale, "/prompts")}
                className="group inline-flex items-center gap-2 text-[14px] font-semibold text-white transition-colors hover:text-[#ff5a00]"
              >
                {content.modules.cta}
                <ArrowUpRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
          </div>
        </Reveal>
        {/* Tabs */}
        <Reveal direction="up" delay={100} threshold={0.25}>
          <div className="mb-10 flex items-center gap-2 overflow-x-auto border-b border-white/10 pb-px">
            {tabs.map((tab, i) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(i)}
                className={`whitespace-nowrap px-5 py-3 text-[13px] font-semibold uppercase tracking-[0.08em] transition-colors duration-300 ${
                  activeTab === i
                    ? "border-b-2 border-white text-white"
                    : "text-[#666] hover:text-[#999]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Cards */}
        <div
          key={tabs[activeTab].key}
          className="grid grid-cols-1 gap-5 md:grid-cols-2"
          style={{
            animation: "showcase-fade 400ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {tabs[activeTab].items.map((item, idx) => {
            const gradient = GRADIENTS[(activeTab * 4 + idx) % GRADIENTS.length];
            return (
              <a
                key={item.title}
                href={localizeHref(locale, item.href)}
                className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] transition-all duration-500 hover:border-white/15 hover:bg-white/[0.06]"
              >
                <div className="p-6 pb-4">
                  <h3 className="mb-2 text-[18px] font-semibold tracking-tight text-white">
                    {item.title}
                  </h3>
                  <p className="mb-4 text-[13px] leading-relaxed text-[#888]">
                    {item.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag, ti) => (
                      <span
                        key={tag}
                        className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                          ti === 0
                            ? "bg-white/10 text-white/80"
                            : "bg-white/5 text-white/40"
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className={`relative mx-4 mb-4 h-[200px] overflow-hidden rounded-xl bg-gradient-to-br ${gradient}`}>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[13px] font-medium text-white backdrop-blur-sm">
                      Explore
                      <ArrowUpRight size={14} />
                    </span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
