import assert from "node:assert/strict";
import { afterEach, beforeEach, it } from "node:test";
import { NextRequest } from "next/server";
import { AUTH_COOKIE, signSessionToken } from "../src/lib/auth-local";
import { POST as post } from "../src/app/api/posts/route";
import { POST as prompt } from "../src/app/api/prompts/route";
import { POST as comment } from "../src/app/api/comments/route";
import { POST as profile } from "../src/app/api/profile/route";
import { POST as like } from "../src/app/api/likes/toggle/route";
import { POST as bulkInsert } from "../src/app/api/skills/bulk-insert/route";

process.env.JWT_SECRET = "mutation-tests-only-32-bytes-or-longer";
process.env.RDB_BASE_URL = "http://mutations-database.example.test";
const originalFetch = globalThis.fetch;
let sequence = 0;
let writes: Array<{ table: string; body: Record<string, unknown> }>;
let duplicateLike = false;
let requestCount = 0;
let profileMissing = false;

function request(path: string, body: unknown, userId = `user-${sequence++}`) {
  return new NextRequest(`https://econagora.test/api/${path}`, {
    method: "POST", headers: {
      "Content-Type": "application/json",
      Cookie: `${AUTH_COOKIE}=${signSessionToken({ id: userId, email: "user@example.test", displayName: "User" })}`,
    }, body: JSON.stringify(body),
  });
}

beforeEach(() => {
  writes = [];
  requestCount = 0;
  duplicateLike = false;
  profileMissing = false;
  globalThis.fetch = async (input, init) => {
    requestCount++;
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    assert.equal(url.hostname, "mutations-database.example.test");
    const table = url.pathname.slice(1);
    const method = init?.method ?? "GET";
    if (method !== "GET") {
      const body = typeof init?.body === "string" ? JSON.parse(init.body) : null;
      writes.push({ table, body });
      if (["prompt", "user_profile", "user_like"].includes(table) && body && "_openid" in body) {
        return Response.json({ code: "PGRST204", message: "The _openid column does not exist" }, { status: 400 });
      }
      if (table === "user_like" && duplicateLike) {
        return Response.json({ code: "23505", message: "duplicate key value violates unique constraint" }, { status: 409 });
      }
      return new Response(null, { status: 204 });
    }
    if (table === "user_like") {
      if (url.searchParams.has("limit")) {
        return Response.json([{ _id: "existing-like" }], { headers: { "Content-Range": "0-0/1" } });
      }
      return Response.json({ code: "PGRST116", message: "0 rows" }, { status: 406 });
    }
    if (table === "user_profile") {
      return profileMissing
        ? Response.json({ code: "PGRST116", message: "0 rows" }, { status: 406 })
        : Response.json({ _id: "profile", name: "User", avatar: null });
    }
    return Response.json({ _id: "target", like_count: 1, status: "PUBLISHED", target_id: "target", target_type: "POST" });
  };
});
afterEach(() => { globalThis.fetch = originalFetch; });

it("disables the anonymous one-time bulk import endpoint without touching the database", async () => {
  const response = await bulkInsert();
  assert.equal(response.status, 410);
  assert.equal(requestCount, 0);
});

it("rejects oversized post titles before writing", async () => {
  const response = await post(request("posts", { title: "x".repeat(201), content: "Body" }));
  assert.equal(response.status, 400);
  assert.equal(writes.length, 0);
});

it("rejects oversized prompt bodies before writing", async () => {
  const response = await prompt(request("prompts", { title: "Title", category: "research", content: "x".repeat(100001) }));
  assert.equal(response.status, 400);
  assert.equal(writes.length, 0);
});

it("rejects malformed, excessive, or oversized tags", async () => {
  for (const tags of [Array(21).fill("tag"), ["x".repeat(65)], [{ unsafe: "value" }], { unexpected: true }]) {
    const response = await post(request("posts", { title: "Title", content: "Body", tags }));
    assert.equal(response.status, 400);
  }
  assert.equal(writes.length, 0);
});

it("allows existing comma-separated tags while deriving the author from the session", async () => {
  const response = await post(request("posts", { title: "Title", content: "Body", tags: "economics, AI", author_id: "other-user" }, "actual-user"));
  assert.equal(response.status, 200);
  assert.equal(writes[0].body.author_id, "actual-user");
  assert.equal(writes[0].body.tags, '["economics","AI"]');
});

it("rejects unsupported locales on new content", async () => {
  const response = await post(request("posts", { title: "Title", content: "Body", locale: "../../private" }));
  assert.equal(response.status, 400);
});

it("bounds comment text before looking up its target", async () => {
  const response = await comment(request("comments", { targetType: "POST", targetId: "target", content: "x".repeat(10001) }));
  assert.equal(response.status, 400);
  assert.equal(requestCount, 0);
});

it("bounds public profile text and prevents unsafe avatar URLs", async () => {
  for (const body of [{ name: "x".repeat(101) }, { name: "User", bio: "x".repeat(2001) }, { name: "User", avatar: "javascript:alert(1)" }]) {
    const response = await profile(request("profile", body));
    assert.equal(response.status, 400);
  }
  assert.equal(writes.length, 0);
});

it("does not pass arbitrary role or private fields into profile writes", async () => {
  const response = await profile(request("profile", { name: "User", role: "ADMIN", phone: "private", email: "other@example.test" }));
  assert.equal(response.status, 200);
  assert.equal(writes[0].body.role, undefined);
  assert.equal(writes[0].body.phone, undefined);
  assert.equal(writes[0].body.email, undefined);
});

it("handles PostgreSQL duplicate likes as an idempotent liked state", async () => {
  duplicateLike = true;
  const response = await like(request("likes/toggle", { targetType: "POST", targetId: "target" }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { liked: true, likeCount: 1 });
});

it("limits repeat publishing for the same user", async () => {
  const responses: number[] = [];
  for (let i = 0; i < 11; i++) {
    const response = await post(request("posts", { title: "Title", content: "Body" }, "repeated-publisher"));
    responses.push(response.status);
    if (response.status === 429) {
      assert.ok(Number(response.headers.get("retry-after")) > 0);
      break;
    }
  }
  assert.ok(responses.includes(429));
  assert.ok(writes.length <= 10);
});

it("creates prompts using only columns present in the PostgreSQL schema", async () => {
  const response = await prompt(request("prompts", { title: "Title", category: "research", content: "Body" }));
  assert.equal(response.status, 200);
  assert.equal(writes[0].body._openid, undefined);
});

it("creates profiles without a legacy CloudBase-only column", async () => {
  profileMissing = true;
  const response = await profile(request("profile", { name: "User" }));
  assert.equal(response.status, 200);
  assert.equal(writes[0].body._openid, undefined);
});

it("creates likes without a legacy CloudBase-only column", async () => {
  const response = await like(request("likes/toggle", { targetType: "POST", targetId: "target" }));
  assert.equal(response.status, 200);
  assert.equal(writes[0].body._openid, undefined);
});
