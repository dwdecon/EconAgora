"use client";

import { createPrompt } from "@/actions/prompts";

const categories = ["文献综述", "数据分析", "论文写作", "审稿回复", "选题", "其他"];

export default function PromptForm() {
  return (
    <form action={createPrompt as any} className="flex flex-col gap-4 max-w-2xl">
      <input
        name="title"
        required
        placeholder="标题"
        className="rounded-lg bg-dark-card border border-dark-border px-4 py-3 text-white placeholder:text-gray-text focus:border-primary focus:outline-none"
      />
      <select
        name="category"
        required
        className="rounded-lg bg-dark-card border border-dark-border px-4 py-3 text-white focus:border-primary focus:outline-none"
      >
        {categories.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
      <input
        name="tags"
        placeholder="标签（逗号分隔）"
        className="rounded-lg bg-dark-card border border-dark-border px-4 py-3 text-white placeholder:text-gray-text focus:border-primary focus:outline-none"
      />
      <textarea
        name="description"
        rows={2}
        placeholder="简短描述"
        className="rounded-lg bg-dark-card border border-dark-border px-4 py-3 text-white placeholder:text-gray-text focus:border-primary focus:outline-none resize-none"
      />
      <textarea
        name="content"
        required
        rows={10}
        placeholder="Prompt 内容"
        className="rounded-lg bg-dark-card border border-dark-border px-4 py-3 text-white placeholder:text-gray-text focus:border-primary focus:outline-none font-mono text-sm"
      />
      <button
        type="submit"
        className="rounded-lg bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-hover transition self-start"
      >
        发布
      </button>
    </form>
  );
}
