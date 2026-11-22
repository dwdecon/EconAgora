import type { RdbQueryBuilder } from "@/lib/rdb";

/** Read a complete, bounded result; each factory must retain a stable row order. */
export async function queryAllPages<T>(
  createQuery: () => RdbQueryBuilder<T[]>,
  options?: { maxRows?: number },
): Promise<T[]> {
  const maxRows = options?.maxRows ?? 10_000;
  if (!Number.isSafeInteger(maxRows) || maxRows < 1 || maxRows > 10_000) {
    throw new Error("Invalid complete-query row budget.");
  }
  const rows: T[] = [];
  for (;;) {
    // One extra row distinguishes an exact budget boundary from truncation.
    const pageSize = Math.min(200, maxRows - rows.length + 1);
    const result = await createQuery().range(rows.length, rows.length + pageSize - 1);
    if (result.error) throw new Error(result.error.message);
    if (!Array.isArray(result.data) || result.data.length > pageSize) {
      throw new Error("Invalid paginated data response.");
    }
    if (rows.length + result.data.length > maxRows) {
      throw new Error(`The complete result exceeds the ${maxRows}-row limit. Narrow your query.`);
    }
    rows.push(...result.data);
    if (result.data.length < pageSize) return rows;
  }
}
