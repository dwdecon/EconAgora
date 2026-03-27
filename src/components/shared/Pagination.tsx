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

  return (
    <div className="mt-12 flex justify-center gap-2">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <Link
          key={page}
          href={buildHref(page)}
          className={`rounded-lg px-3 py-1.5 text-sm transition ${
            page === currentPage
              ? "bg-primary text-white"
              : "border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          {page}
        </Link>
      ))}
    </div>
  );
}
