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

  const pageButtonClass =
    "min-w-[40px] rounded-full px-3 py-1.5 text-center text-[14px] transition-colors shadow-[var(--shadow-inset-button)]";
  const pageLinkClass =
    "border border-[var(--color-border-hover)] bg-[var(--color-bg-surface-strong)] text-[var(--color-text-secondary)] hover:bg-[var(--color-text-primary)] hover:text-[var(--color-bg)]";
  const activePageClass =
    "border border-[var(--color-text-primary)] bg-[var(--color-text-primary)] text-[var(--color-bg)] font-medium";
  const navLinkClass =
    "rounded-full border border-[var(--color-border-hover)] bg-[var(--color-bg-surface-strong)] px-4 py-1.5 text-center text-[14px] text-[var(--color-text-secondary)] transition-colors shadow-[var(--shadow-inset-button)] hover:bg-[var(--color-text-primary)] hover:text-[var(--color-bg)]";
  const disabledNavClass =
    "cursor-not-allowed rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-1.5 text-center text-[14px] text-[var(--color-text-muted)] opacity-50 shadow-[var(--shadow-inset-button)]";

  return (
    <nav
      className="mt-12 flex flex-wrap items-center justify-center gap-2"
      aria-label="Pagination"
    >
      {hasPreviousPage ? (
        <Link href={buildHref(currentPage - 1)} className={navLinkClass}>
          上一页
        </Link>
      ) : (
        <span className={disabledNavClass} aria-disabled="true">
          上一页
        </span>
      )}

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <Link
          key={page}
          href={buildHref(page)}
          aria-current={page === currentPage ? "page" : undefined}
          className={`${pageButtonClass} ${page === currentPage ? activePageClass : pageLinkClass}`}
        >
          {page}
        </Link>
      ))}

      {hasNextPage ? (
        <Link href={buildHref(currentPage + 1)} className={navLinkClass}>
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
