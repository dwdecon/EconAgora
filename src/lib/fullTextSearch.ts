import type { RdbQueryBuilder } from "@/lib/rdb";

function normalizeSearchTerm(search: string) {
  return search.replace(/[(),]/g, " ").replace(/\s+/g, " ").trim();
}

export function applyFullTextSearch<TData>(
  query: RdbQueryBuilder<TData>,
  search: string,
  columns: string[],
) {
  const normalizedSearch = normalizeSearchTerm(search);

  if (!normalizedSearch || columns.length === 0) {
    return query;
  }

  const pattern = `%${normalizedSearch}%`;

  return query.or(
    columns.map((column) => `${column}.like.${pattern}`).join(","),
  );
}
