/** Blog views are stored by the single Node service process. */
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { getBlogPostBySlug, isValidBlogSlug } from "@/lib/blog-data";

const VIEW_DATA_DIR = process.env.BLOG_VIEW_DATA_DIR || path.join("/var/www/EconAgora", "data/blog-views");
const VIEW_DATA_PATH = path.join(VIEW_DATA_DIR, "views.json");
const MAX_REQUEST_BYTES = 1024;
const MAX_VIEW_RECORDS = 10_000;
const MAX_STORAGE_BYTES = 5 * 1024 * 1024;
const VISITOR_WINDOW_MS = 60_000;
const recentVisitors = new Map<string, number>();
let writeQueue: Promise<void> = Promise.resolve();
let pendingWrites = 0;

interface ViewRecord {
  slug: string;
  views: number;
  lastViewed: string;
}

function validSlug(slug: unknown): slug is string {
  return typeof slug === "string" && isValidBlogSlug(slug) &&
    !["__proto__", "constructor", "prototype"].includes(slug);
}

async function getViewData(): Promise<Record<string, ViewRecord>> {
  try {
    if ((await fs.stat(VIEW_DATA_PATH)).size > MAX_STORAGE_BYTES) {
      throw new Error("Blog view storage exceeds its size limit");
    }
    const raw = await fs.readFile(VIEW_DATA_PATH, "utf-8");
    let data: unknown;
    try { data = JSON.parse(raw); }
    catch { throw new Error("Blog view storage contains invalid JSON"); }
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("Blog view storage contains invalid records");
    }
    const entries = Object.entries(data);
    if (entries.length > MAX_VIEW_RECORDS) throw new Error("Blog view storage exceeds its record limit");
    const records: Record<string, ViewRecord> = Object.create(null);
    for (const [slug, record] of entries) {
      if (!validSlug(slug) || !record || typeof record !== "object" ||
        record.slug !== slug || !Number.isSafeInteger(record.views) || record.views < 0 ||
        typeof record.lastViewed !== "string") {
        throw new Error("Blog view storage contains invalid records");
      }
      records[slug] = record;
    }
    return records;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return Object.create(null);
    throw error;
  }
}

async function incrementView(slug: string): Promise<number> {
  const operation = writeQueue.then(async () => {
    const records = await getViewData();
    if (!records[slug] && Object.keys(records).length >= MAX_VIEW_RECORDS) {
      throw new Error("Blog view storage exceeds its record limit");
    }
    const count = Math.min((records[slug]?.views || 0) + 1, Number.MAX_SAFE_INTEGER);
    records[slug] = { slug, views: count, lastViewed: new Date().toISOString() };
    await fs.mkdir(VIEW_DATA_DIR, { recursive: true, mode: 0o700 });
    const temporaryPath = path.join(VIEW_DATA_DIR, `views-${randomUUID()}.tmp`);
    try {
      await fs.writeFile(temporaryPath, JSON.stringify(records), { mode: 0o600, flag: "wx" });
      // Readers see the complete previous or next snapshot, never a partial JSON file.
      await fs.rename(temporaryPath, VIEW_DATA_PATH);
    } finally {
      await fs.unlink(temporaryPath).catch(() => {});
    }
    return count;
  });
  pendingWrites += 1;
  writeQueue = operation.then(() => {}, () => {});
  try { return await operation; }
  finally { pendingWrites -= 1; }
}

async function readViewRequest(request: NextRequest): Promise<unknown> {
  if (Number(request.headers.get("Content-Length")) > MAX_REQUEST_BYTES) return undefined;
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_REQUEST_BYTES) {
        await reader.cancel();
        return undefined;
      }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks, bytes).toString("utf8"));
  } catch { return null; }
  finally { reader.releaseLock(); }
}

export async function POST(request: NextRequest) {
  const body = await readViewRequest(request);
  if (body === undefined) return NextResponse.json({ error: "Request is too large" }, { status: 413 });
  const slug = body && typeof body === "object" ? (body as { slug?: unknown }).slug : null;
  if (!validSlug(slug)) return NextResponse.json({ error: "Missing or invalid slug" }, { status: 400 });

  let visitorKey: string | undefined;
  let started = 0;
  try {
    if (!await getBlogPostBySlug(slug)) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }
    if (pendingWrites >= 128) {
      return NextResponse.json({ error: "View storage is busy" }, { status: 503 });
    }
    // Nginx appends the peer address, so use the final forwarded address.
    const visitor = request.headers.get("x-forwarded-for")?.split(",").pop()?.trim() ||
      request.headers.get("x-real-ip") || "unknown";
    visitorKey = `${slug}:${visitor.slice(0, 128)}`;
    started = Date.now();
    if (started - (recentVisitors.get(visitorKey) ?? 0) < VISITOR_WINDOW_MS) {
      return NextResponse.json({ error: "View already recorded recently" }, {
        status: 429, headers: { "Retry-After": "60" },
      });
    }
    if (recentVisitors.size >= MAX_VIEW_RECORDS) {
      recentVisitors.delete(recentVisitors.keys().next().value!);
    }
    recentVisitors.set(visitorKey, started);
    const views = await incrementView(slug);
    return NextResponse.json({ success: true, slug, views });
  } catch (error) {
    if (visitorKey && recentVisitors.get(visitorKey) === started) recentVisitors.delete(visitorKey);
    console.error("Error recording blog view:", error);
    return NextResponse.json({ error: "Failed to record view" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const slug = new URL(request.url).searchParams.get("slug");
  if (slug !== null && !validSlug(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }
  try {
    const views = await getViewData();
    return NextResponse.json(slug ? { slug, views: views[slug]?.views || 0 } : views);
  } catch (error) {
    console.error("Error getting blog views:", error);
    return NextResponse.json({ error: "Failed to get views" }, { status: 500 });
  }
}
