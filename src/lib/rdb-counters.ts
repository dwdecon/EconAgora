import { serverDb } from "@/lib/rdb-server";
import { toSqlTimestamp } from "@/lib/rdb-utils";

const MAX_COUNTER_RETRIES = 8;

type CounterResult = {
  error: { message: string; raw?: unknown } | null;
  value: number | null;
};

function normalizeCounterValue(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isRetryableCounterConflict(error: { message: string; raw?: unknown } | null) {
  if (!error) {
    return false;
  }

  const message = JSON.stringify(error.raw ?? error.message);
  return (
    message.includes("0 rows") ||
    message.includes("PGRST116") ||
    message.includes("multiple (or no) rows returned")
  );
}

async function readCounterValue(
  table: string,
  rowId: string,
  column: string,
): Promise<CounterResult> {
  const result = await serverDb
    .from(table)
    .select(`_id,${column}`)
    .eq("_id", rowId)
    .single();

  if (result.error || !result.data) {
    return {
      value: null,
      error: result.error ?? { message: `Failed to load ${table} counter.` },
    };
  }

  return {
    value: normalizeCounterValue((result.data as any)[column]),
    error: null,
  };
}

export async function incrementNumericCounter(
  table: string,
  rowId: string,
  column: string,
  delta: number,
  options?: { min?: number; maxRetries?: number },
): Promise<CounterResult> {
  const min = options?.min ?? 0;
  const maxRetries = options?.maxRetries ?? MAX_COUNTER_RETRIES;

  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    const current = await readCounterValue(table, rowId, column);
    if (current.error || current.value === null) {
      return current;
    }

    const nextValue = Math.max(min, current.value + delta);
    if (nextValue === current.value) {
      return current;
    }

    const result = await serverDb
      .from(table)
      .update({ [column]: nextValue, updated_at: toSqlTimestamp() })
      .eq("_id", rowId)
      .eq(column, current.value)
      .select(column)
      .single();

    if (!result.error && result.data) {
      return {
        value: normalizeCounterValue((result.data as any)[column]),
        error: null,
      };
    }

    if (!isRetryableCounterConflict(result.error)) {
      return {
        value: null,
        error: result.error ?? { message: `Failed to update ${column}.` },
      };
    }
  }

  return {
    value: null,
    error: { message: `Failed to update ${column} after ${maxRetries} retries.` },
  };
}

export async function setNumericCounter(
  table: string,
  rowId: string,
  column: string,
  nextValue: number,
  options?: { min?: number; maxRetries?: number },
): Promise<CounterResult> {
  const min = options?.min ?? 0;
  const maxRetries = options?.maxRetries ?? MAX_COUNTER_RETRIES;
  const desiredValue = Math.max(min, Math.trunc(nextValue));

  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    const current = await readCounterValue(table, rowId, column);
    if (current.error || current.value === null) {
      return current;
    }

    if (current.value === desiredValue) {
      return current;
    }

    const result = await serverDb
      .from(table)
      .update({ [column]: desiredValue, updated_at: toSqlTimestamp() })
      .eq("_id", rowId)
      .eq(column, current.value)
      .select(column)
      .single();

    if (!result.error && result.data) {
      return {
        value: normalizeCounterValue((result.data as any)[column]),
        error: null,
      };
    }

    if (!isRetryableCounterConflict(result.error)) {
      return {
        value: null,
        error: result.error ?? { message: `Failed to set ${column}.` },
      };
    }
  }

  return {
    value: null,
    error: { message: `Failed to set ${column} after ${maxRetries} retries.` },
  };
}

export async function syncLikeCount(
  table: "post" | "prompt",
  targetId: string,
  targetType: "POST" | "PROMPT",
): Promise<CounterResult> {
  const result = await serverDb
    .from("user_like")
    .select("_id", { count: "exact" })
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .limit(1);

  if (result.error) {
    return {
      value: null,
      error: result.error,
    };
  }

  return setNumericCounter(table, targetId, "like_count", result.count ?? 0);
}
