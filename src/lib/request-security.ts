import { NextResponse } from "next/server";
import { isIP } from "node:net";
import { normalizeTags } from "@/lib/rdb-utils";

function reject(message: string, status: number, headers: Record<string, string> = {}) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

/** Reject browser mutations from another origin, while allowing non-browser scripts. */
export function validateMutationOrigin(request: Request): NextResponse | null {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method.toUpperCase())) return null;
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return reject("Cross-origin request is not allowed.", 403);
  }
  if (origin) {
    try {
      let target = new URL(request.url);
      // Next standalone can use its loopback bind address in request.url. Host is
      // the HTTP authority supplied by the browser and overwritten by nginx.
      // Do not trust a caller-supplied X-Forwarded-Host instead.
      const host = request.headers.get("host");
      if (host) {
        if (!/^(?:[a-z0-9.-]+|\[[a-f0-9:]+\])(?::\d{1,5})?$/i.test(host)) {
          return reject("Invalid request host.", 403);
        }
        target = new URL(`${target.protocol}//${host}`);
      }
      if (new URL(origin).origin === target.origin) return null;
    } catch {
      // A malformed or opaque Origin cannot be same-origin.
    }
    return reject("Cross-origin request is not allowed.", 403);
  }
  return null;
}

/** Bound the full incoming body, including requests without Content-Length. */
export async function readBodyBytes(request: Request, maxBytes: number): Promise<
  { bytes: Uint8Array<ArrayBuffer> } | { response: NextResponse }
> {
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > maxBytes)) {
    return { response: reject("Request body is too large.", 413) };
  }
  const reader = request.body?.getReader();
  if (!reader) return { response: reject("A request body is required.", 400) };
  try {
    let bytes = 0;
    const chunks: Uint8Array[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel();
        return { response: reject("Request body is too large.", 413) };
      }
      chunks.push(value);
    }
    const result = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return { bytes: result };
  } catch {
    return { response: reject("Invalid request body.", 400) };
  } finally {
    reader.releaseLock();
  }
}

/** Read a bounded JSON object, including requests without Content-Length. */
export async function readJsonBody(request: Request, maxBytes = 16 * 1024): Promise<
  { body: Record<string, unknown> } | { response: NextResponse }
> {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) {
    return { response: reject("Content-Type must be application/json.", 415) };
  }
  const input = await readBodyBytes(request, maxBytes);
  if ("response" in input) return input;
  try {
    const body: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(input.bytes));
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return { response: reject("A JSON object is required.", 400) };
    }
    return { body: body as Record<string, unknown> };
  } catch {
    return { response: reject("Invalid JSON body.", 400) };
  }
}

/** Preserve existing comma-separated/JSON tags, but never coerce arbitrary objects. */
export function boundedTags(value: unknown): string[] | null {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) {
    if (value.some((tag) => typeof tag !== "string")) return null;
  } else if (typeof value !== "string" || value.length > 8192) return null;
  if (typeof value === "string" && value.trim().startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(value);
      if (!Array.isArray(parsed) || parsed.some((tag) => typeof tag !== "string")) return null;
    } catch {
      return null;
    }
  }
  const tags = normalizeTags(value);
  if (tags.length > 20 || tags.some((tag) => tag.length > 64)) return null;
  return [...new Set(tags)];
}

const buckets = new Map<string, { count: number; expiresAt: number }>();
const MAX_BUCKETS = 10_000;

/** Nginx must overwrite X-Real-IP; the application listens on loopback only. Never use client XFF. */
export function getClientAddress(request: Request): string {
  const address = request.headers.get("x-real-ip")?.trim() ?? "";
  return isIP(address) ? address : "unknown";
}

/** Single-process limits; cardinality is bounded and a full table fails closed. */
export function rateLimit(key: string, limit: number, windowMs: number): NextResponse | null {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || bucket.expiresAt <= now) {
    if (buckets.size >= MAX_BUCKETS) {
      for (const [name, entry] of buckets) {
        if (entry.expiresAt <= now) buckets.delete(name);
      }
      if (!buckets.has(key) && buckets.size >= MAX_BUCKETS) {
        return reject("Too many requests. Please try again later.", 429, { "Retry-After": "60" });
      }
    }
    bucket = { count: 0, expiresAt: now + windowMs };
    buckets.set(key, bucket);
  }
  if (bucket.count >= limit) {
    return reject("Too many requests. Please try again later.", 429, {
      "Retry-After": String(Math.max(1, Math.ceil((bucket.expiresAt - now) / 1000))),
    });
  }
  bucket.count++;
  return null;
}
