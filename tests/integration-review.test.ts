import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { syncLikeCount } from "../src/lib/rdb-counters";
import { NextRequest } from "next/server";
import { AUTH_COOKIE, signSessionToken, verifySessionToken } from "../src/lib/auth-local";
import { GET as me } from "../src/app/api/auth/me/route";
import { POST as logout } from "../src/app/api/auth/logout/route";
import { db } from "../src/lib/cloudbase";
import { proxyRdbRead } from "../src/lib/rdb-proxy";
import { queryAllPages } from "../src/lib/rdb-pagination";

process.env.JWT_SECRET = "test-only-independent-integration-review-key";
process.env.RDB_BASE_URL = "http://integration-review.example.test";

test("a me response delivered after logout cannot restore the logged-out session cookie", async () => {
  const token = signSessionToken({ id: "previous-user", email: "previous@example.test", displayName: "Previous" });
  const requestHeaders = { Cookie: `${AUTH_COOKIE}=${token}` };
  // The network may retain this response while a later logout finishes first.
  const delayedMe = await me(new NextRequest("https://example.test/api/auth/me", { headers: requestHeaders }));
  const signedOut = await logout(new NextRequest("https://example.test/api/auth/logout", { method: "POST", headers: requestHeaders }));
  assert.equal(signedOut.cookies.get(AUTH_COOKIE)?.value, "");
  const lateCookie = delayedMe.cookies.get(AUTH_COOKIE)?.value;
  assert.equal(lateCookie ? verifySessionToken(lateCookie) : null, null,
    "the late me response must not reissue an authenticated cookie after logout");
});

test("a delayed like synchronization cannot overwrite a newer aggregate", async () => {
  let counter = 0;
  let countReads = 0;
  let releaseOldCount!: () => void;
  const oldCountGate = new Promise<void>((resolve) => { releaseOldCount = resolve; });
  let reportOldCountStarted!: () => void;
  const oldCountStarted = new Promise<void>((resolve) => { reportOldCountStarted = resolve; });
  const spy = mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    assert.equal(url.hostname, "integration-review.example.test");
    if (url.pathname === "/user_like") {
      const snapshot = ++countReads;
      if (snapshot === 1) {
        reportOldCountStarted();
        await oldCountGate;
      }
      return Response.json([{ _id: "like" }], { headers: { "Content-Range": `0-0/${snapshot}` } });
    }
    assert.equal(url.pathname, "/post");
    if (init?.method === "PATCH") {
      assert.equal(url.searchParams.get("like_count"), `eq.${counter}`);
      counter = JSON.parse(String(init.body)).like_count;
    }
    return Response.json({ _id: "post", like_count: counter });
  });
  try {
    const oldSynchronization = syncLikeCount("post", "post", "POST");
    await oldCountStarted;
    const newSynchronization = syncLikeCount("post", "post", "POST");
    await new Promise<void>((resolve) => setImmediate(resolve));
    releaseOldCount();
    await Promise.all([oldSynchronization, newSynchronization]);
    assert.equal(counter, 2, "the final counter must retain both committed likes");
  } finally {
    releaseOldCount();
    spy.mock.restore();
  }
});

test("the paginated detail-comment query retains all 51 comments through the public proxy", async () => {
  const comments = Array.from({ length: 51 }, (_, index) => ({
    _id: `comment-${index}`, target_type: "POST", target_id: "post", content: `Comment ${index}`,
  }));
  const spy = mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const address = String(input);
    if (address.startsWith("/api/rdb/")) {
      return proxyRdbRead(new Request(`https://example.test${address}`, init), ["comment"]);
    }
    const upstream = new URL(address);
    assert.equal(upstream.hostname, "integration-review.example.test");
    if (upstream.pathname === "/post") return Response.json([{ _id: "post" }]);
    const offset = Number(upstream.searchParams.get("offset") ?? 0);
    return Response.json(comments.slice(offset, offset + Number(upstream.searchParams.get("limit") ?? comments.length)));
  });
  try {
    // Matches the query in both community and prompt detail pages.
    const rows = await queryAllPages(() => db.from("comment").select("*").eq("target_type", "POST")
      .eq("target_id", "post").order("created_at", { ascending: true }).order("_id"));
    assert.equal(rows.length, 51, "a complete thread must not silently lose comments at the proxy default limit");
  } finally {
    spy.mock.restore();
  }
});
