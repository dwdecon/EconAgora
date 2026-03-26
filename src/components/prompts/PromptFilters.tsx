"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Search, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";

const categories = [
  { label: "All", value: "" },
  { label: "Literature", value: "Literature Review" },
  { label: "Data", value: "Data Analysis" },
  { label: "Writing", value: "Paper Writing" },
  { label: "Review", value: "Peer Review" },
  { label: "Topic", value: "Topic Selection" },
  { label: "Other", value: "Other" },
];

export default function PromptFilters() {
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
    router.push(query ? `/prompts?${query}` : "/prompts");
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
    router.push("/prompts");
  }

  return (
    <div className="space-y-3">
      {/* Single row: tabs + search */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {/* Category tabs */}
        <div className="flex flex-1 gap-1 overflow-x-auto">
          {categories.map((cat) => {
            const isActive = currentCategory === cat.value;
            return (
              <button
                key={cat.label}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm transition ${
                  isActive
                    ? "bg-[#f15325] font-medium text-white"
                    : "bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-strong)]"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <form
          onSubmit={submitSearch}
          className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-2 lg:w-[280px]"
        >
          <Search className="h-4 w-4 shrink-0 text-[var(--color-text-secondary)]" strokeWidth={1.8} />
          <input
            value={draftSearch}
            onChange={(e) => setDraftSearch(e.target.value)}
            placeholder="Search prompts..."
            className="min-w-0 flex-1 bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
          />
          {draftSearch && (
            <button
              type="button"
              onClick={() => {
                setDraftSearch("");
                if (currentSearch) clearField("search");
              }}
              className="text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.8} />
            </button>
          )}
        </form>
      </div>

      {/* Active filter badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {currentCategory && (
            <button
              type="button"
              onClick={() => clearField("category")}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-1 text-xs text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]"
            >
              {currentCategory}
              <X className="h-3 w-3" strokeWidth={1.8} />
            </button>
          )}
          {currentTag && (
            <button
              type="button"
              onClick={() => clearField("tag")}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-1 text-xs text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]"
            >
              Tag: {currentTag}
              <X className="h-3 w-3" strokeWidth={1.8} />
            </button>
          )}
          {currentSearch && (
            <button
              type="button"
              onClick={() => clearField("search")}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-1 text-xs text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]"
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
      )}
    </div>
  );
}
