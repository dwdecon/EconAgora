export function createId(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export function extractRowId(
  row: { _id?: unknown; id?: unknown } | null | undefined,
) {
  if (!row) return null;
  if (typeof row._id === "string" && row._id) return row._id;
  if (typeof row.id === "string" && row.id) return row.id;
  return null;
}

export function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value !== "string") {
    return [];
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return normalizeTags(parsed);
    }
  } catch {
    // Ignore parse failures and fall back to comma splitting.
  }

  return trimmed
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
