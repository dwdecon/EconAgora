import { Link } from "@/i18n/navigation";

export default function Pagination({
  currentPage,
  totalPages,
  basePath,
}: {
  currentPage: number;
  totalPages: number;
  basePath: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-12 flex justify-center gap-2">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <Link
          key={page}
          href={`${basePath}?page=${page}`}
          className={`rounded-lg px-3 py-1.5 text-sm transition ${
            page === currentPage
              ? "bg-primary text-white"
              : "border border-dark-border text-gray-text hover:text-white"
          }`}
        >
          {page}
        </Link>
      ))}
    </div>
  );
}
