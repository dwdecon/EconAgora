"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";

function useFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "";
  const currentSearch = searchParams.get("search") || "";
  
  function navigate(params: URLSearchParams) {
    const query = params.toString();
    const scrollPosition = window.scrollY;
    router.push(query ? `/prompts?${query}` : "/prompts", { scroll: false });
    requestAnimationFrame(() => {
      window.scrollTo({ top: scrollPosition, behavior: "instant" });
    });
  }

  function setSearch(search: string) {
    const params = new URLSearchParams(searchParams.toString());
    const value = search.trim();
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    params.delete("page");
    navigate(params);
  }
  
  function resetAll() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    params.delete("search");
    params.delete("tag");
    params.delete("page");
    navigate(params);
  }

  return { currentCategory, currentSearch, setSearch, resetAll };
}

export function PromptSearchBar() {
  const { currentSearch, setSearch } = useFilters();
  const [draftSearch, setDraftSearch] = useState(currentSearch);
  const locale = useLocale();

  useEffect(() => {
    setDraftSearch(currentSearch);
  }, [currentSearch]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(draftSearch);
  }

  return (
    <form onSubmit={submitSearch} className="relative flex items-center mb-8">
      <input
        type="text"
        value={draftSearch}
        onChange={(e) => setDraftSearch(e.target.value)}
        placeholder={locale === "en" ? "Search prompt titles, descriptions, and content..." : "搜索 Prompt 标题、描述和正文..."}
        className="w-full h-[52px] rounded-[6px] border-2 border-[var(--color-border)] bg-[var(--color-bg-card)] py-2 px-6 text-[16px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-border-hover)] focus:shadow-[var(--shadow-focus)] transition-all duration-300"
      />
      <button type="submit" className="ml-3 h-[52px] px-8 rounded-[6px] bg-[var(--color-text-primary)] text-[var(--color-bg)] hover:opacity-80 text-[16px] font-normal transition-opacity shadow-[var(--shadow-inset-button)] whitespace-nowrap">
        {locale === "en" ? "Search" : "搜索"}
      </button>
    </form>
  );
}

// Placeholder for dropdown filters if needed later, currently using PromptFilters component
export function PromptDropdownFilters() {
    return null;
}
