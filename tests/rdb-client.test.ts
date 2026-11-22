import assert from "node:assert/strict";
import { test } from "node:test";
import { RdbQueryBuilder } from "../src/lib/rdb";

test("anonymous same-origin reads work without exposing a session token", async () => {
  const original = globalThis.fetch;
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = async (input, init) => {
    requests.push({ url: String(input), init });
    return new Response('[{"_id":"post-1"}]', { headers: { "Content-Range": "0-0/1" } });
  };
  try {
    const result = await new RdbQueryBuilder("post", "/api/rdb", "")
      .select("_id", { count: "exact" }).limit(10);
    assert.equal(result.error, null);
    assert.deepEqual(result.data, [{ _id: "post-1" }]);
    assert.equal(result.count, 1);
    assert.equal(requests[0].url, "/api/rdb/post?select=_id&limit=10");
    assert.equal(new Headers(requests[0].init?.headers).has("Authorization"), false);
    assert.equal(requests[0].init?.credentials, "same-origin");
    assert.ok(requests[0].init?.signal);
  } finally { globalThis.fetch = original; }
});

test("server requests still need a real service token", async () => {
  const result = await new RdbQueryBuilder("post", "http://127.0.0.1:3100", "").select("_id");
  assert.ok(result.error);
});

test("relative authenticated reads and literal in-filter values stay well formed", async () => {
  const original = globalThis.fetch;
  let requestUrl = "";
  globalThis.fetch = async (input) => {
    requestUrl = String(input);
    return new Response("[]");
  };
  try {
    const result = await new RdbQueryBuilder("post", "/api/rdb", "legacy-user-token")
      .in("title", ["a,b", 'a"b', "plain"]).ilike("content", "%Case%");
    assert.equal(result.error, null);
    const params = new URL(requestUrl, "https://econagora.com").searchParams;
    assert.equal(params.get("title"), 'in.("a,b","a\\"b",plain)');
    assert.equal(params.get("content"), "ilike.%Case%");
  } finally { globalThis.fetch = original; }
});
