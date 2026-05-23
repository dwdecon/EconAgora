"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";

export default function Pagination({
  currentPage,
  totalPages,
  basePath,
  queryString = "",
}: {
  currentPage: number;
  totalPages: number;
  basePath: string;
  queryString?: string;
}) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isLoading) return;
    document.body.style.cursor = "wait";
    return () => {
      document.body.style.cursor = "";
    };
  }, [isLoading]);

  if (totalPages <= 1) return null;

  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  function buildHref(page: number) {
    const params = new URLSearchParams(queryString);
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  const navLinkClass = `rounded-full border border-[var(--color-border-hover)] bg-[var(--color-bg-surface-strong)] px-4 py-1.5 text-center text-[14px] text-[var(--color-text-secondary)] transition-colors shadow-[var(--shadow-inset-button)] hover:bg-[var(--color-text-primary)] hover:text-[var(--color-bg)] ${
    isLoading ? "pointer-events-none cursor-wait" : "cursor-pointer"
  }`;
  const disabledNavClass =
    "cursor-not-allowed rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-1.5 text-center text-[14px] text-[var(--color-text-muted)] opacity-50 shadow-[var(--shadow-inset-button)]";

  return (
    <nav
      className="mt-12 flex items-center justify-center gap-4"
      aria-label="Pagination"
    >
      {hasPreviousPage ? (
        <Link
          href={buildHref(currentPage - 1)}
          className={navLinkClass}
          onClick={() => setIsLoading(true)}
        >
          上一页
        </Link>
      ) : (
        <span className={disabledNavClass} aria-disabled="true">
          上一页
        </span>
      )}

      <span className="text-sm text-[var(--color-text-secondary)]">
        第 {currentPage} / {totalPages} 页
      </span>

      {hasNextPage ? (
        <Link
          href={buildHref(currentPage + 1)}
          className={navLinkClass}
          onClick={() => setIsLoading(true)}
        >
          下一页
        </Link>
      ) : (
        <span className={disabledNavClass} aria-disabled="true">
          下一页
        </span>
      )}
    </nav>
  );
}
