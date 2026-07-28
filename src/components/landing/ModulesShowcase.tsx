"use client";

import { useState, useMemo } from "react";
import { ArrowUpRight } from "lucide-react";
import Reveal from "@/components/shared/Reveal";
import { getHomeContent, localizeHref } from "./content";
import type { Prompt } from "@/lib/prompts";
import type { Skill } from "@/lib/skills";
import type { Tool } from "@/lib/tools";
import type { Post } from "@/lib/posts";

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

interface ModulesShowcaseProps {
  locale: string;
  featuredPrompts?: Prompt[];
  featuredSkills?: Skill[];
  featuredTools?: Tool[];
  featuredPosts?: Post[];
  featuredAgentPosts?: Post[];
}

type ModuleCardItem = {
  title: string;
  description: string;
  tags: string[];
  href: string;
  slug: string;
  external?: boolean;
  preview?: string;
};

export default function ModulesShowcase({
  locale,
  featuredPrompts = [],
  featuredSkills = [],
  featuredTools = [],
  featuredPosts = [],
  featuredAgentPosts = [],
}: ModulesShowcaseProps) {
  const content = getHomeContent(locale);
  const [activeTab, setActiveTab] = useState(0);

  const tabs = useMemo(() => {
    const staticTabs = content.modules.tabs;

    return staticTabs.map((tab) => {
      let items: ModuleCardItem[] = tab.items;

      // Inject real data based on tab key
      if (tab.key === "prompts" && featuredPrompts.length > 0) {
        items = featuredPrompts.map((p) => ({
          title: p.title,
          description: p.description || "",
          tags: p.tags,
          href: `/prompts/${p.id}`,
          slug: p.id,
          preview: p.content,
        }));
      } else if (tab.key === "skills" && featuredSkills.length > 0) {
        items = featuredSkills.map((s) => ({
          title: s.title,
          description: s.description || "",
          tags: s.tags,
          href: `/skills/${s.id}`,
          slug: s.id,
          preview: s.codeExamples || s.tutorial || "",
        }));
      } else if (tab.key === "tools" && featuredTools.length > 0) {
        items = featuredTools.map((t) => ({
          title: t.title,
          description: t.description || "",
          tags: t.tags,
          href: `/tools/${encodeURIComponent(t.id)}`,
          slug: t.id,
          preview: t.quickStart || t.integrationGuide || "",
        }));
      } else if (tab.key === "community" && featuredPosts.length > 0) {
        items = featuredPosts.map((post) => ({
          title: post.title,
          description: post.content.substring(0, 100).replace(/[#*`]/g, "") + "...",
          tags: post.tags,
          href: `/community/${post.id}`,
          slug: post.id,
          preview: post.content,
        }));
      } else if (tab.key === "broadcast" && featuredAgentPosts.length > 0) {
        items = featuredAgentPosts.map((post) => ({
          title: post.title,
          description: post.content.substring(0, 100).replace(/[#*`]/g, "") + "...",
          tags: post.tags,
          href: `/community/${post.id}`,
          slug: post.id,
          preview: post.content,
        }));
      }

      return { ...tab, items };
    });
  }, [content.modules.tabs, featuredPrompts, featuredSkills, featuredTools, featuredPosts, featuredAgentPosts]);

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
            const previewText = item.preview || "";

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
                  <p className="mb-4 line-clamp-2 text-[13px] leading-relaxed text-[#888]">
                    {item.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.slice(0, 3).map((tag, ti) => (
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
                <div className={`relative mx-4 mb-4 h-[280px] overflow-hidden rounded-xl bg-gradient-to-br ${gradient} p-6 transition-transform duration-500 group-hover:scale-[1.01]`}>
                  {/* Code/Prompt Preview Overlay */}
                  <div className="pointer-events-none select-none font-mono text-[12px] leading-[1.6] tracking-tight text-white/20 transition-opacity duration-500 group-hover:text-white/35">
                    <div className="line-clamp-[15] whitespace-pre-wrap">
                      {previewText || "Loading research assets..."}
                    </div>
                  </div>

                  {/* Enhanced mask for a more sophisticated code window feel */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/30" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span className="inline-flex items-center gap-2.5 rounded-full bg-white/10 px-6 py-3 text-[15px] font-bold text-white shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl border border-white/20 ring-1 ring-white/10">
                      Explore Asset
                      <ArrowUpRight size={18} />
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
