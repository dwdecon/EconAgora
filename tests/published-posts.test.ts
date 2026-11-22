import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test, mock } from "node:test";

test("featured post queries exclude unpublished rows even with a service credential", async () => {
  process.env.JWT_SECRET = "test-only-featured-posts-key";
  process.env.RDB_BASE_URL = "http://published-posts.example.test";
  const require = createRequire(import.meta.url);
  const nextCache = require("next/cache");
  const cacheStub = mock.method(nextCache, "unstable_cache", (fn: unknown) => fn);
  const original = globalThis.fetch;
  const requests: URL[] = [];
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    requests.push(url);
    return Response.json(url.searchParams.get("status") === "eq.PUBLISHED" ? [] : [{ _id: "draft", title: "Private draft" }]);
  };
  try {
    const { fetchFeaturedPosts, fetchFeaturedAgentPosts } = await import("../src/lib/posts");
    assert.deepEqual(await fetchFeaturedPosts(), []);
    assert.deepEqual(await fetchFeaturedAgentPosts(), []);
    assert.equal(requests.length, 2);
    assert.ok(requests.every((url) => url.searchParams.get("status") === "eq.PUBLISHED"));
  } finally { globalThis.fetch = original; cacheStub.mock.restore(); }
});
