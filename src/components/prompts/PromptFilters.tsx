"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";

const categories = [
  "Literature Review",
  "Data Analysis",
  "Paper Writing",
  "Peer Review",
  "Topic Selection",
  "Other",
];

export default function PromptFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "";

  function setCategory(category: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (category) {
      params.set("category", category);
    } else {
      params.delete("category");
    }
    params.delete("page");
    router.push(`/prompts?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => setCategory("")}
        className={`rounded-full px-4 py-1.5 text-sm transition ${
          !currentCategory
            ? "bg-primary text-white"
            : "border border-dark-border text-gray-text hover:text-white"
        }`}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => setCategory(category)}
          className={`rounded-full px-4 py-1.5 text-sm transition ${
            currentCategory === category
              ? "bg-primary text-white"
              : "border border-dark-border text-gray-text hover:text-white"
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
