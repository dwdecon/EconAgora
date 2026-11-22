import assert from "node:assert/strict";
import { test } from "node:test";
import { proxyRdbRead } from "../src/lib/rdb-proxy";

test("public comment reads exclude comments whose parent is not published", async () => {
  const original = globalThis.fetch;
  let commentsFilter = "";
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/post")) {
      assert.equal(url.searchParams.get("status"), "eq.PUBLISHED");
      return Response.json([{ _id: "published-post" }]);
    }
    commentsFilter = url.searchParams.get("target_id") ?? "";
    return Response.json(commentsFilter.includes("private-post")
      ? [{ _id: "private-comment" }, { _id: "public-comment" }]
      : [{ _id: "public-comment" }]);
  };
  try {
    const response = await proxyRdbRead(new Request("https://econagora.com/api/rdb/comment?target_type=eq.POST&target_id=in.(published-post,private-post)"), ["comment"]);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), [{ _id: "public-comment" }]);
    assert.equal(commentsFilter, "in.(published-post)");
  } finally { globalThis.fetch = original; }
});

test("unpublished parents return no comments and unscoped queries fail closed", async () => {
  const original = globalThis.fetch;
  const paths: string[] = [];
  globalThis.fetch = async (input) => {
    paths.push(new URL(String(input)).pathname);
    return Response.json([]);
  };
  try {
    const response = await proxyRdbRead(new Request("https://econagora.com/api/rdb/comment?target_type=eq.PROMPT&target_id=eq.hidden-prompt"), ["comment"]);
    assert.deepEqual(await response.json(), []);
    assert.ok(!paths.some((path) => path.endsWith("/comment")));
    assert.equal((await proxyRdbRead(new Request("https://econagora.com/api/rdb/comment"), ["comment"])).status, 400);
  } finally { globalThis.fetch = original; }
});
