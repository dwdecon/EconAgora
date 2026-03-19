"use client";

import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";

const categories = ["文献综述", "数据分析", "论文写作", "审稿回复", "选题", "其他"];

export default function PromptFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "";

  function setCategory(cat: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (cat) params.set("category", cat);
    else params.delete("category");
    params.delete("page");
    router.push(`/prompts?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => setCategory("")}
        className={`rounded-full px-4 py-1.5 text-sm transition ${
          !currentCategory ? "bg-primary text-white" : "border border-dark-border text-gray-text hover:text-white"
        }`}
      >
        全部
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => setCategory(cat)}
          className={`rounded-full px-4 py-1.5 text-sm transition ${
            currentCategory === cat ? "bg-primary text-white" : "border border-dark-border text-gray-text hover:text-white"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
