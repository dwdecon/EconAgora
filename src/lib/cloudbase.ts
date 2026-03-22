"use client";

import cloudbase from "../../node_modules/@cloudbase/app/dist/esm/index.js";
import { registerAuth } from "../../node_modules/@cloudbase/auth/dist/esm/index.js";

cloudbase.registerVersion("2.26.3");

try {
  registerAuth(cloudbase as any);
} catch {}

const envId = process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID;
const accessKey = process.env.NEXT_PUBLIC_CLOUDBASE_ACCESS_KEY;
const region = process.env.NEXT_PUBLIC_CLOUDBASE_REGION ?? "ap-shanghai";
const isBrowser = typeof window !== "undefined";

const app =
  isBrowser && envId
    ? cloudbase.init({
        env: envId,
        region,
        ...(accessKey ? { accessKey } : {}),
        auth: { detectSessionInUrl: true },
      } as any)
    : null;

export const auth: any = app ? app.auth : null;

type CountMode = "exact";
type FilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "like"
  | "ilike"
  | "contains"
  | "in";

interface Filter {
  column: string;
  operator: FilterOperator;
  value: unknown;
}

interface QueryOrder {
  column: string;
  ascending: boolean;
}

interface QueryResult<T = any> {
  count: number | null;
  data: T;
  error: { message: string; raw?: unknown } | null;
}

const baseUrl = envId ? `https://${envId}.api.tcloudbasegateway.com/v1/rdb/rest` : "";

function parseContentRange(contentRange: string | null): number | null {
  if (!contentRange) return null;
  const total = contentRange.split("/")[1];
  if (!total || total === "*") return null;
  const parsed = Number(total);
  return Number.isFinite(parsed) ? parsed : null;
}

function stringifyValue(value: unknown): string {
  if (value === null) return "null";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "boolean" || typeof value === "number") {
    return String(value);
  }
  return String(value);
}

function serializeFilter({ operator, value }: Filter): string {
  switch (operator) {
    case "contains": {
      if (Array.isArray(value) && value.length === 1) {
        return `like.%"${String(value[0])}"%`;
      }
      return `like.%${JSON.stringify(value)}%`;
    }
    case "in": {
      const values = Array.isArray(value) ? value : [value];
      return `in.(${values.map((item) => stringifyValue(item)).join(",")})`;
    }
    default:
      return `${operator}.${stringifyValue(value)}`;
  }
}

async function getAuthorizationToken() {
  try {
    const session = await auth?.getSession?.();
    return session?.data?.session?.access_token || accessKey || "";
  } catch {
    return accessKey || "";
  }
}

class RdbQueryBuilder<TData = any> implements PromiseLike<QueryResult<TData>> {
  private readonly table: string;
  private method: "GET" | "POST" | "PATCH" | "DELETE" = "GET";
  private readonly filters: Filter[] = [];
  private readonly orders: QueryOrder[] = [];
  private columns = "*";
  private limitValue: number | null = null;
  private offsetValue: number | null = null;
  private countMode: CountMode | null = null;
  private singleResult = false;
  private returnRepresentation = false;
  private body: unknown = null;

  constructor(table: string) {
    this.table = table;
  }

  select(columns = "*", options?: { count?: CountMode }) {
    this.columns = columns || "*";
    if (options?.count) {
      this.countMode = options.count;
    }
    if (this.method !== "GET") {
      this.returnRepresentation = true;
    }
    return this;
  }

  insert(values: unknown) {
    this.method = "POST";
    this.body = values;
    return this;
  }

  update(values: unknown) {
    this.method = "PATCH";
    this.body = values;
    return this;
  }

  delete() {
    this.method = "DELETE";
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, operator: "eq", value });
    return this;
  }

  neq(column: string, value: unknown) {
    this.filters.push({ column, operator: "neq", value });
    return this;
  }

  gt(column: string, value: unknown) {
    this.filters.push({ column, operator: "gt", value });
    return this;
  }

  gte(column: string, value: unknown) {
    this.filters.push({ column, operator: "gte", value });
    return this;
  }

  lt(column: string, value: unknown) {
    this.filters.push({ column, operator: "lt", value });
    return this;
  }

  lte(column: string, value: unknown) {
    this.filters.push({ column, operator: "lte", value });
    return this;
  }

  like(column: string, value: string) {
    this.filters.push({ column, operator: "like", value });
    return this;
  }

  ilike(column: string, value: string) {
    this.filters.push({ column, operator: "ilike", value });
    return this;
  }

  contains(column: string, value: unknown) {
    this.filters.push({ column, operator: "contains", value });
    return this;
  }

  in(column: string, value: unknown[]) {
    this.filters.push({ column, operator: "in", value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orders.push({
      column,
      ascending: options?.ascending ?? true,
    });
    return this;
  }

  range(from: number, to: number) {
    this.offsetValue = from;
    this.limitValue = Math.max(0, to - from + 1);
    return this;
  }

  limit(limit: number) {
    this.limitValue = limit;
    return this;
  }

  single() {
    this.singleResult = true;
    return this;
  }

  async execute(): Promise<QueryResult<TData>> {
    if (!baseUrl) {
      return {
        count: null,
        data: (this.singleResult ? null : []) as TData,
        error: { message: "CloudBase environment is not configured." },
      };
    }

    const authorizationToken = await getAuthorizationToken();
    if (!authorizationToken) {
      return {
        count: null,
        data: (this.singleResult ? null : []) as TData,
        error: { message: "CloudBase access token is missing." },
      };
    }

    const url = new URL(`${baseUrl}/${this.table}`);
    const shouldSelect = this.method === "GET" || this.returnRepresentation;

    if (shouldSelect) {
      url.searchParams.set("select", this.columns);
    }
    if (this.orders.length > 0) {
      url.searchParams.set(
        "order",
        this.orders
          .map((item) => `${item.column}.${item.ascending ? "asc" : "desc"}`)
          .join(","),
      );
    }
    if (this.limitValue !== null) {
      url.searchParams.set("limit", String(this.limitValue));
    }
    if (this.offsetValue !== null) {
      url.searchParams.set("offset", String(this.offsetValue));
    }
    for (const filter of this.filters) {
      url.searchParams.append(filter.column, serializeFilter(filter));
    }

    const preferDirectives: string[] = [];
    if (this.countMode) {
      preferDirectives.push(`count=${this.countMode}`);
    }
    if (this.method !== "GET") {
      preferDirectives.push(
        this.returnRepresentation ? "return=representation" : "return=minimal",
      );
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${authorizationToken}`,
      "Content-Type": "application/json",
    };
    if (preferDirectives.length > 0) {
      headers.Prefer = preferDirectives.join(",");
    }
    if (this.singleResult) {
      headers.Accept = "application/vnd.pgrst.object+json";
    }

    try {
      const response = await fetch(url.toString(), {
        method: this.method,
        headers,
        body: this.body !== null ? JSON.stringify(this.body) : undefined,
      });

      const text = await response.text();
      let payload: unknown = null;

      if (text) {
        try {
          payload = JSON.parse(text);
        } catch {
          payload = text;
        }
      }

      const count = parseContentRange(response.headers.get("Content-Range"));
      if (!response.ok) {
        const message =
          (payload as any)?.message ||
          (payload as any)?.error ||
          response.statusText ||
          "CloudBase request failed.";
        return {
          count,
          data: (this.singleResult ? null : []) as TData,
          error: { message, raw: payload },
        };
      }

      const normalizedData = this.singleResult
        ? (Array.isArray(payload) ? payload[0] ?? null : payload)
        : (Array.isArray(payload)
            ? payload
            : payload === null
              ? []
              : [payload]) as TData;

      return {
        count,
        data: normalizedData as TData,
        error: null,
      };
    } catch (error) {
      return {
        count: null,
        data: (this.singleResult ? null : []) as TData,
        error: {
          message:
            error instanceof Error ? error.message : "CloudBase request failed.",
          raw: error,
        },
      };
    }
  }

  then<TResult1 = QueryResult<TData>, TResult2 = never>(
    onfulfilled?:
      | ((value: QueryResult<TData>) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?:
      | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
      | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

export const db = {
  from<TData = any>(table: string) {
    return new RdbQueryBuilder<TData>(table);
  },
};

export async function getSessionUser() {
  try {
    const session = await auth?.getSession?.();
    return session?.data?.session?.user ?? null;
  } catch {
    return null;
  }
}

export function useCloudBaseReady() {
  return Boolean(app);
}
