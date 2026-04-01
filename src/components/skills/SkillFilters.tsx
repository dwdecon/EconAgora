"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Search, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";

const categories = [
  { en: "All", zh: "全部", value: "" },
  { en: "Data Analysis", zh: "数据分析", value: "Data Analysis" },
  { en: "Visualization", zh: "可视化", value: "Visualization" },
  { en: "Writing", zh: "写作", value: "Writing" },
  { en: "Automation", zh: "自动化", value: "Automation" },
  { en: "API Integration", zh: "API 集成", value: "API Integration" },
];

const FILTER_PILL_CLASSES =
  "inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-1 text-xs text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]";

export default function SkillFilters() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "";
  const currentSearch = searchParams.get("search") || "";
  const currentTag = searchParams.get("tag") || "";
  const hasActiveFilters = Boolean(currentCategory || currentSearch || currentTag);

  const [draftSearch, setDraftSearch] = useState(currentSearch);

  useEffect(() => {
    setDraftSearch(currentSearch);
  }, [currentSearch]);

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

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const value = draftSearch.trim();
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    params.delete("page");
    navigate(params);
  }

  function clearField(field: "category" | "search" | "tag") {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(field);
    params.delete("page");
    if (field === "search") setDraftSearch("");
    navigate(params);
  }

  function clearAll() {
    setDraftSearch("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    params.delete("search");
    params.delete("tag");
    params.delete("page");
    navigate(params);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex flex-1 gap-1 overflow-x-auto">
          {categories.map((cat) => {
            const isActive = currentCategory === cat.value;
            const label = locale === "en" ? cat.en : cat.zh;
            return (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-primary text-white"
                    : "bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-strong)]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <form onSubmit={submitSearch} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={draftSearch}
            onChange={(e) => setDraftSearch(e.target.value)}
            placeholder={locale === "en" ? "Search skills..." : "搜索技能..."}
            className="h-9 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface)] py-2 pl-9 pr-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-primary focus:outline-none lg:w-48"
          />
        </form>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {currentCategory && (
            <span className={FILTER_PILL_CLASSES}>
              {categories.find((c) => c.value === currentCategory)?.[
                locale === "en" ? "en" : "zh"
              ] || currentCategory}
              <button
                onClick={() => clearField("category")}
                className="ml-1 hover:text-primary"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {currentTag && (
            <span className={FILTER_PILL_CLASSES}>
              {currentTag}
              <button
                onClick={() => clearField("tag")}
                className="ml-1 hover:text-primary"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {currentSearch && (
            <span className={FILTER_PILL_CLASSES}>
              "{currentSearch}"
              <button
                onClick={() => clearField("search")}
                className="ml-1 hover:text-primary"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          <button
            onClick={clearAll}
            className="text-xs text-[var(--color-text-muted)] hover:text-primary"
          >
            {locale === "en" ? "Clear all" : "清除全部"}
          </button>
        </div>
      )}
    </div>
  );
}