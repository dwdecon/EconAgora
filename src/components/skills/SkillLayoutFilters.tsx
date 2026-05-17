"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { X } from "lucide-react";
import { useRouter } from "@/i18n/navigation";

const FILTER_PILL_CLASSES =
  "inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-1 text-xs text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]";

function useSkillFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "";
  const currentSearch = searchParams.get("search") || "";

  function navigate(params: URLSearchParams) {
    const query = params.toString();
    const scrollPosition = window.scrollY;
    router.push(query ? `/skills?${query}` : "/skills", { scroll: false });
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

export function SkillSearchBar() {
  const { currentSearch, setSearch } = useSkillFilters();
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
        onChange={(event) => setDraftSearch(event.target.value)}
        placeholder={
          locale === "en"
            ? "Search skills, descriptions, and content..."
            : "搜索技能标题、描述和内容..."
        }
        className="w-full h-[52px] rounded-[6px] border-2 border-[var(--color-border)] bg-[var(--color-bg-card)] py-2 px-6 text-[16px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-border-hover)] focus:shadow-[var(--shadow-focus)] transition-all duration-300"
      />
      <button
        type="submit"
        className="ml-3 h-[52px] px-8 rounded-[6px] bg-[var(--color-text-primary)] text-[var(--color-bg)] hover:opacity-80 text-[16px] font-normal transition-opacity shadow-[var(--shadow-inset-button)] whitespace-nowrap"
      >
        {locale === "en" ? "Search" : "搜索"}
      </button>
    </form>
  );
}

import { AccordionSidebar } from "@/components/shared/AccordionSidebar";

export function SkillSidebar({ categories }: { categories: string[] }) {
  return <AccordionSidebar categories={categories} basePath="/skills" />;
}

export function SkillActiveFilters() {
  const searchParams = useSearchParams();
  const { navigate } = useSkillFilters();
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

export function SkillDropdownFilters({
  totalResults,
  currentPage,
  totalPages,
}: {
  totalResults: number;
  currentPage: number;
  totalPages: number;
}) {
  const locale = useLocale();

  return (
    <div className="mb-6">
      <div className="flex items-center gap-4 px-1 text-sm text-[var(--color-text-muted)]">
        <span>
          {locale === "en" ? `${totalResults} results` : `${totalResults} 条结果`}
        </span>
        <span>
          {locale === "en"
            ? `Page ${currentPage} / ${totalPages}`
            : `第 ${currentPage} / ${totalPages} 页`}
        </span>
        <span className="hidden sm:inline">
          {locale === "en"
            ? "All items retain original source links."
            : "所有条目均保留原始来源链接。"}
        </span>
      </div>
    </div>
  );
}
