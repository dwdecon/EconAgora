"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { X } from "lucide-react";
import { useRouter } from "@/i18n/navigation";

const FILTER_PILL_CLASSES =
  "inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-1 text-xs text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]";

function useToolFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "";
  const currentSearch = searchParams.get("search") || "";

  function navigate(params: URLSearchParams) {
    const query = params.toString();
    const scrollPosition = window.scrollY;
    router.push(query ? `/tools?${query}` : "/tools", { scroll: false });
    requestAnimationFrame(() => {
      window.scrollTo({ top: scrollPosition, behavior: "instant" });
    });
  }

  function setCategory(category: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (category) {
      params.set("category", category);
    } else {
      params.delete("category");
    }
    params.delete("page");
    navigate(params);
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

  return { currentCategory, currentSearch, setCategory, setSearch, navigate };
}

export function ToolSearchBar() {
  const locale = useLocale();
  const { currentSearch, setSearch } = useToolFilters();
  const [draftSearch, setDraftSearch] = useState(currentSearch);

  useEffect(() => {
    setDraftSearch(currentSearch);
  }, [currentSearch]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(draftSearch);
  }

  return (
    <form
      onSubmit={submitSearch}
      className="relative mb-8 flex items-center"
    >
      <input
        type="text"
        value={draftSearch}
        onChange={(event) => setDraftSearch(event.target.value)}
        placeholder={
          locale === "en"
            ? "Search tools, descriptions, and guides..."
            : "搜索工具标题、描述和指南..."
        }
        className="h-[52px] w-full rounded-[6px] border-2 border-[var(--color-border)] bg-[var(--color-bg-card)] px-6 py-2 text-[16px] text-[var(--color-text-primary)] transition-all duration-300 placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-hover)] focus:outline-none focus:shadow-[var(--shadow-focus)]"
      />
      <button
        type="submit"
        className="ml-3 h-[52px] whitespace-nowrap rounded-[6px] bg-[var(--color-text-primary)] px-8 text-[16px] font-normal text-[var(--color-bg)] shadow-[var(--shadow-inset-button)] transition-opacity hover:opacity-80"
      >
        {locale === "en" ? "Search" : "搜索"}
      </button>
    </form>
  );
}

import { AccordionSidebar } from "@/components/shared/AccordionSidebar";

export function ToolSidebarFilters({
  categories,
  availableSubcategories,
}: {
  categories: string[];
  availableSubcategories?: Record<string, string[]>;
}) {
  return (
    <AccordionSidebar
      categories={categories}
      basePath="/tools"
      availableSubcategories={availableSubcategories}
    />
  );
}

export default function ToolActiveFilters() {
  const searchParams = useSearchParams();
  const { navigate } = useToolFilters();
  const currentSearch = searchParams.get("search") || "";
  const currentTag = searchParams.get("tag") || "";
  const currentCategory = searchParams.get("category") || "";
  const currentSubcategory = searchParams.get("subcategory") || "";
  const hasActiveFilters = Boolean(currentSearch || currentTag || currentCategory || currentSubcategory);

  function clearField(field: "category" | "search" | "tag" | "subcategory") {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(field);
    if (field === "category") params.delete("subcategory");
    params.delete("page");
    navigate(params);
  }

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    params.delete("subcategory");
    params.delete("search");
    params.delete("tag");
    params.delete("page");
    navigate(params);
  }

  if (!hasActiveFilters) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {currentCategory && (
        <button
          type="button"
          onClick={() => clearField("category")}
          className={FILTER_PILL_CLASSES}
        >
          {currentCategory}
          <X className="h-3 w-3" strokeWidth={1.8} />
        </button>
      )}
      {currentSubcategory && (
        <button
          type="button"
          onClick={() => clearField("subcategory")}
          className={FILTER_PILL_CLASSES}
        >
          {currentCategory} / {currentSubcategory}
          <X className="h-3 w-3" strokeWidth={1.8} />
        </button>
      )}
      {currentTag && (
        <button
          type="button"
          onClick={() => clearField("tag")}
          className={FILTER_PILL_CLASSES}
        >
          Tag: {currentTag}
          <X className="h-3 w-3" strokeWidth={1.8} />
        </button>
      )}
      {currentSearch && (
        <button
          type="button"
          onClick={() => clearField("search")}
          className={FILTER_PILL_CLASSES}
        >
          &ldquo;{currentSearch}&rdquo;
          <X className="h-3 w-3" strokeWidth={1.8} />
        </button>
      )}
      <button
        type="button"
        onClick={clearAll}
        className="text-xs text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]"
      >
        Clear all
      </button>
    </div>
  );
}
