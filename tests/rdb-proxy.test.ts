import assert from "node:assert/strict";
import { test } from "node:test";
import { signSessionToken } from "../src/lib/auth-local";

process.env.JWT_SECRET = "test-only-session-key-for-rdb-proxy-regressions";

async function proxy(request: Request, table: string) {
  const { proxyRdbRead } = await import("../src/lib/rdb-proxy");
  return proxyRdbRead(request, [table]);
}

test("anonymous proxy reads force published content and bound pagination", async () => {
  const original = globalThis.fetch;
  let upstream = "";
  globalThis.fetch = async (input) => {
    upstream = String(input);
    return new Response('[{"_id":"p1"}]', { headers: { "content-range": "0-0/1" } });
  };
  try {
    const response = await proxy(new Request("https://econagora.com/api/rdb/prompt?select=*&status=neq.PUBLISHED&limit=9999"), "prompt");
    assert.equal(response.status, 200);
    assert.equal(new URL(upstream).searchParams.get("limit"), "200");
    assert.ok(new URL(upstream).searchParams.getAll("status").includes("eq.PUBLISHED"));
    assert.equal(response.headers.get("Content-Range"), "0-0/1");
    assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  } finally { globalThis.fetch = original; }
});

test("profile wildcard reads expose only public profile columns", async () => {
  const original = globalThis.fetch;
  let selection = "";
  globalThis.fetch = async (input) => {
    selection = new URL(String(input)).searchParams.get("select") ?? "";
    return new Response("[]");
  };
  try {
    assert.equal((await proxy(new Request("https://econagora.com/api/rdb/user_profile?select=*"), "user_profile")).status, 200);
    assert.ok(selection.includes("name"));
    for (const field of ["email", "phone", "role"]) assert.ok(!selection.split(",").includes(field));
    assert.equal((await proxy(new Request("https://econagora.com/api/rdb/user_profile?select=email"), "user_profile")).status, 403);
    assert.equal((await proxy(new Request("https://econagora.com/api/rdb/user_profile?email=eq.private%40example.com"), "user_profile")).status, 400);
  } finally { globalThis.fetch = original; }
});

test("private tables, RPC and direct mutations never reach PostgREST", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; return new Response("[]"); };
  try {
    assert.equal((await proxy(new Request("https://econagora.com/api/rdb/auth_users"), "auth_users")).status, 404);
    assert.equal((await proxy(new Request("https://econagora.com/api/rdb/rpc"), "rpc")).status, 404);
    assert.equal((await proxy(new Request("https://econagora.com/api/rdb/user_profile", { method: "PATCH", body: '{"role":"ADMIN"}' }), "user_profile")).status, 405);
    assert.equal(calls, 0);
  } finally { globalThis.fetch = original; }
});

test("likes require a user session and are restricted to that user's records", async () => {
  const original = globalThis.fetch;
  let upstream = "";
  let bearer = "";
  globalThis.fetch = async (input, init) => {
    upstream = String(input);
    bearer = new Headers(init?.headers).get("authorization") ?? "";
    return new Response("[]");
  };
  try {
    const url = "https://econagora.com/api/rdb/user_like?user_id=eq.someone-else";
    assert.equal((await proxy(new Request(url), "user_like")).status, 401);
    const token = signSessionToken({ id: "user-a", email: "a@example.com", displayName: "A" });
    const response = await proxy(new Request(url, { headers: { cookie: `econagora_jwt=${token}` } }), "user_like");
    assert.equal(response.status, 200);
    assert.ok(new URL(upstream).searchParams.getAll("user_id").includes("eq.user-a"));
    assert.equal(bearer, `Bearer ${token}`);
  } finally { globalThis.fetch = original; }
});
