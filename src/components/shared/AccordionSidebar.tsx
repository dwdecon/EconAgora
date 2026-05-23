"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { ChevronDown } from "lucide-react";
import { useRouter } from "@/i18n/navigation";

interface AccordionSidebarProps {
  categories: string[];
  basePath: string;
  availableSubcategories?: Record<string, string[]>;
}

export function AccordionSidebar({ categories, basePath, availableSubcategories }: AccordionSidebarProps) {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "";
  const currentSubcategory = searchParams.get("subcategory") || "";
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(currentCategory ? [currentCategory] : [])
  );

  function navigate(params: URLSearchParams) {
    const query = params.toString();
    const scrollPosition = window.scrollY;
    router.push(query ? `${basePath}?${query}` : basePath, { scroll: false });
    requestAnimationFrame(() => {
      window.scrollTo({ top: scrollPosition, behavior: "instant" });
    });
  }

  function toggleCategory(category: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }

  function selectCategory(category: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (category) {
      params.set("category", category);
    } else {
      params.delete("category");
    }
    params.delete("subcategory");
    params.delete("page");
    navigate(params);
  }

  function selectSubcategory(category: string, subcategory: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", category);
    params.set("subcategory", subcategory);
    params.delete("page");
    navigate(params);
  }

  const allItem = { value: "", label: locale === "en" ? "All Categories" : "全部" };

  return (
    <div className="sticky top-24 space-y-6">
      <div>
        <h3 className="mb-3 px-2 text-sm font-medium text-[var(--color-text-secondary)]">
          {locale === "en" ? "Categories" : "分类"}
        </h3>
        <ul className="space-y-1">
          <li>
            <button
              type="button"
              onClick={() => selectCategory("")}
              className={`flex w-full items-center rounded-full border px-4 py-2.5 text-[14px] transition-colors cursor-pointer ${
                !currentCategory
                  ? "border-[var(--color-text-primary)] bg-[var(--color-text-primary)] font-medium text-[var(--color-bg)]"
                  : "border-[var(--color-border)] bg-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-card)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              <span>{allItem.label}</span>
            </button>
          </li>

          {categories.map((category) => {
            const isExpanded = expanded.has(category);
            const isActive = currentCategory === category && !currentSubcategory;
            const subcategories = availableSubcategories?.[category] ?? [];
            const hasVisibleSubcategories = subcategories.length > 0;

            return (
              <li key={category}>
                <button
                  type="button"
                  onClick={() => {
                    if (hasVisibleSubcategories) {
                      toggleCategory(category);
                    }
                    selectCategory(category);
                  }}
                  className={`flex w-full items-center justify-between rounded-full border px-4 py-2 text-[14px] transition-colors cursor-pointer ${
                    isActive
                      ? "border-[var(--color-text-primary)] bg-[var(--color-text-primary)] font-medium text-[var(--color-bg)]"
                      : currentCategory === category
                      ? "border-[var(--color-border-hover)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]"
                      : "border-transparent bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  <span>{category}</span>
                  {hasVisibleSubcategories && (
                    <ChevronDown
                      className={`ml-2 h-4 w-4 shrink-0 transition-transform duration-300 ease-out ${
                        isExpanded ? "rotate-0" : "-rotate-90"
                      }`}
                    />
                  )}
                </button>

                {hasVisibleSubcategories && (
                  <div
                    className="grid transition-all duration-300 ease-out"
                    style={{
                      gridTemplateRows: isExpanded ? "1fr" : "0fr",
                      opacity: isExpanded ? 1 : 0,
                    }}
                  >
                    <div className="overflow-hidden">
                      <ul className="ml-5 space-y-0.5 border-l border-[var(--color-border)] pl-3 pt-1">
                        {subcategories.map((sub) => {
                          const isSubActive = currentCategory === category && currentSubcategory === sub;
                          return (
                            <li key={sub}>
                              <button
                                type="button"
                                onClick={() => selectSubcategory(category, sub)}
                                className={`flex w-full items-center rounded-full px-4 py-1.5 text-[13px] transition-colors cursor-pointer ${
                                  isSubActive
                                    ? "bg-[var(--color-bg-surface-strong)] font-medium text-[var(--color-text-primary)]"
                                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                                }`}
                              >
                                <span>{sub}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
