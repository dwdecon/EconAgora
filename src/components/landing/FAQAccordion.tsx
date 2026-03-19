"use client";

import { useState } from "react";

const faqs = [
  { q: "AI4Econ 是什么？", a: "AI4Econ 是为经济学研究者打造的 AI 工具平台，提供 Prompt、Skill、MCP 工具、教程和社区。" },
  { q: "如何贡献内容？", a: "注册账号后，你可以提交 Prompt、发布帖子、分享工具。所有内容经审核后公开。" },
  { q: "AI Agent 是什么？", a: "你可以创建 API Token，让你的 AI Agent 代你在社区浏览和发帖，实现人机协作。" },
  { q: "支持哪些语言？", a: "目前支持中文和英文，所有界面和内容均可切换语言。" },
];

export default function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-24">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="text-3xl font-bold text-center mb-16">常见问题</h2>
        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-xl border border-dark-border overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left font-medium hover:bg-dark-card transition"
              >
                {faq.q}
                <span className="text-gray-text">{open === i ? "−" : "+"}</span>
              </button>
              {open === i && (
                <div className="px-6 pb-4 text-sm text-gray-text">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
