import assert from "node:assert/strict";
import { mock, test } from "node:test";
import jwt from "jsonwebtoken";
import { signSessionToken } from "../src/lib/auth-local";
import { proxyRdbRead } from "../src/lib/rdb-proxy";

process.env.JWT_SECRET = "test-only-rdb-independent-review-key";

test("quoted private columns in logical filters never reach PostgREST", async () => {
  const fetchSpy = mock.method(globalThis, "fetch", async () => Response.json([{ _id: "matched-user" }]));
  try {
    for (const expression of ['("email".eq.victim@example.test)', '(email .eq.victim@example.test)', '("role".eq.ADMIN)', '(and("email".like.*@example.test,_id.neq.missing))']) {
      const query = new URLSearchParams({ select: "_id", or: expression });
      const response = await proxyRdbRead(new Request(`https://example.test/api/rdb/user_profile?${query}`), ["user_profile"]);
      assert.ok([400, 403].includes(response.status), `private filter was accepted: ${expression}`);
    }
    assert.equal(fetchSpy.mock.callCount(), 0);
  } finally {
    fetchSpy.mock.restore();
  }
});

test("escaped quoted private columns cannot bypass logical filter validation", async () => {
  const fetchSpy = mock.method(globalThis, "fetch", async () => Response.json([{ _id: "matched-user" }]));
  try {
    // PostgREST's pQuotedValue consumes a backslash followed by any character,
    // so these two valid identifiers resolve to email and role respectively.
    for (const expression of [String.raw`("em\ail".eq.victim@example.test)`, String.raw`("r\ole".eq.ADMIN)`]) {
      const query = new URLSearchParams({ select: "_id", or: expression });
      const response = await proxyRdbRead(new Request(`https://example.test/api/rdb/user_profile?${query}`), ["user_profile"]);
      assert.ok([400, 403].includes(response.status), `escaped private filter was accepted: ${expression}`);
    }
    assert.equal(fetchSpy.mock.callCount(), 0);
  } finally {
    fetchSpy.mock.restore();
  }
});

test("repeated offset parameters cannot bypass the validated pagination ceiling", async () => {
  let forwarded = "";
  const fetchSpy = mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => {
    forwarded = String(input);
    return Response.json([]);
  });
  try {
    const response = await proxyRdbRead(new Request("https://example.test/api/rdb/post?select=_id&offset=0&offset=1000000000"), ["post"]);
    if (response.status === 200) {
      const offsets = new URL(forwarded).searchParams.getAll("offset");
      // PostgREST builds offsetParams using HashMap.fromList, so the final value wins.
      assert.ok(offsets.length <= 1 && offsets.every((value) => Number(value) <= 100_000));
    } else {
      assert.equal(response.status, 400);
      assert.equal(fetchSpy.mock.callCount(), 0);
    }
  } finally {
    fetchSpy.mock.restore();
  }
});

test("oversized database responses are rejected before exposing an unbounded body", async () => {
  const fetchSpy = mock.method(globalThis, "fetch", async () => new Response("[]", {
    headers: { "Content-Length": String(32 * 1024 * 1024) },
  }));
  try {
    const response = await proxyRdbRead(new Request("https://example.test/api/rdb/post?select=content"), ["post"]);
    assert.equal(response.status, 503);
  } finally {
    fetchSpy.mock.restore();
  }
});

test("chunked database responses are cancelled once they exceed the response budget", async () => {
  let chunks = 0;
  let cancelled = false;
  const chunk = new Uint8Array(2 * 1024 * 1024);
  const fetchSpy = mock.method(globalThis, "fetch", async () => new Response(new ReadableStream({
    pull(controller) {
      if (chunks++ < 4) controller.enqueue(chunk);
      else if (chunks <= 16) controller.enqueue(new Uint8Array(1));
      else controller.error(new Error("Response reader exceeded its bounded test budget"));
    },
    cancel() { cancelled = true; },
  })));
  try {
    const response = await proxyRdbRead(new Request("https://example.test/api/rdb/post?select=content"), ["post"]);
    assert.equal(response.status, 503);
    assert.equal(cancelled, true);
    assert.ok(chunks <= 7, `upstream kept being read after the byte limit: ${chunks} pulls`);
  } finally {
    fetchSpy.mock.restore();
  }
});

test("service tokens never become user sessions or get forwarded to public queries", async () => {
  const token = jwt.sign({ sub: "svc:test", role: "authenticated", svc: true }, process.env.JWT_SECRET!, { expiresIn: "1h" });
  let bearer: string | null = "unexpected";
  const fetchSpy = mock.method(globalThis, "fetch", async (_input: RequestInfo | URL, init?: RequestInit) => {
    bearer = new Headers(init?.headers).get("Authorization");
    return Response.json([]);
  });
  try {
    const headers = { Authorization: `Bearer ${token}` };
    assert.equal((await proxyRdbRead(new Request("https://example.test/api/rdb/user_like", { headers }), ["user_like"])).status, 401);
    assert.equal((await proxyRdbRead(new Request("https://example.test/api/rdb/post", { headers }), ["post"])).status, 200);
    assert.equal(bearer, null);
  } finally {
    fetchSpy.mock.restore();
  }
});

test("a valid cookie retains user isolation even when a conflicting Bearer is attached", async () => {
  const cookie = signSessionToken({ id: "cookie-user", email: "cookie@example.test", displayName: "Cookie" });
  const bearer = signSessionToken({ id: "bearer-user", email: "bearer@example.test", displayName: "Bearer" });
  let upstream = "";
  let forwardedToken = "";
  const fetchSpy = mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    upstream = String(input);
    forwardedToken = new Headers(init?.headers).get("Authorization") ?? "";
    return Response.json([]);
  });
  try {
    const response = await proxyRdbRead(new Request("https://example.test/api/rdb/user_like?user_id=eq.bearer-user", {
      headers: { Cookie: `econagora_jwt=${cookie}`, Authorization: `Bearer ${bearer}` },
    }), ["user_like"]);
    assert.equal(response.status, 200);
    assert.ok(new URL(upstream).searchParams.getAll("user_id").includes("eq.cookie-user"));
    assert.equal(forwardedToken, `Bearer ${cookie}`);
  } finally {
    fetchSpy.mock.restore();
  }
});

