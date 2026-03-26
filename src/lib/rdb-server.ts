/**
 * Server-side RDB query builder.
 * Uses CLOUDBASE_ACCESS_KEY (server-only) — no browser SDK, no "use client".
 * Safe to import from Server Components and Route Handlers.
 *
 * Fallback: NEXT_PUBLIC_CLOUDBASE_ACCESS_KEY if server-only key not set.
 * For production, set CLOUDBASE_ACCESS_KEY with a server-privileged token.
 */
import { RdbQueryBuilder } from "@/lib/rdb";

const envId = process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID ?? "";
// Prefer server-only key; fallback to publishable key if not set
const accessKey = process.env.CLOUDBASE_ACCESS_KEY || process.env.NEXT_PUBLIC_CLOUDBASE_ACCESS_KEY || "";
const baseUrl = envId
  ? `https://${envId}.api.tcloudbasegateway.com/v1/rdb/rest`
  : "";

export const serverDb = {
  from<TData = any>(table: string) {
    return new RdbQueryBuilder<TData>(table, baseUrl, accessKey);
  },
};
