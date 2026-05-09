"use client";

import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { X } from "lucide-react";

const FILTER_PILL_CLASSES =
  "inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-1 text-xs text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]";

export function PromptSidebarFilters({ categories }: { categories: string[] }) {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "";

  function navigate(params: URLSearchParams) {
    const query = params.toString();
    const scrollPosition = window.scrollY;
    router.push(query ? `/prompts?${query}` : "/prompts", { scroll: false });
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

  const sidebarItems = [
    { value: "", label: locale === "en" ? "All Categories" : "全部" },
    ...categories.map((category) => ({ value: category, label: category })),
  ];

  return (
    <div className="sticky top-24 space-y-6">
      <div>
        <h3 className="mb-3 px-2 text-sm font-medium text-[var(--color-text-secondary)]">
          {locale === "en" ? "Categories" : "分类"}
        </h3>
        <ul className="space-y-1.5">
          {sidebarItems.map((category) => {
            const isActive = currentCategory === category.value;

            return (
              <li key={category.value || "__all__"}>
                <button
                  type="button"
                  onClick={() => setCategory(category.value)}
                  className={`flex w-full items-center justify-between rounded-full border px-4 py-2.5 text-[14px] transition-colors ${
                    isActive
                      ? "border-[var(--color-text-primary)] bg-[var(--color-text-primary)] font-medium text-[var(--color-bg)] shadow-[var(--shadow-inset-button)]"
                      : "border-[var(--color-border)] bg-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-card)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  <span>{category.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default function PromptActiveFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.get("search") || "";
  const currentTag = searchParams.get("tag") || "";
  const currentCategory = searchParams.get("category") || "";
  const hasActiveFilters = Boolean(currentSearch || currentTag || currentCategory);

  function navigate(params: URLSearchParams) {
    const query = params.toString();
    const scrollPosition = window.scrollY;
    router.push(query ? `/prompts?${query}` : "/prompts", { scroll: false });
    requestAnimationFrame(() => {
      window.scrollTo({ top: scrollPosition, behavior: "instant" });
    });
  }

  function clearField(field: "category" | "search" | "tag") {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(field);
    params.delete("page");
    navigate(params);
  }

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
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
