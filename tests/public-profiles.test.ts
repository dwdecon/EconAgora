import assert from "node:assert/strict";
import { mock, test } from "node:test";

test("201 unique authors load in three bounded public-profile requests", async () => {
  const { fetchPublicProfiles } = await import("../src/lib/public-profiles");
  const ids = Array.from({ length: 201 }, (_, index) => `user-${index}`);
  const requests: URL[] = [];
  const spy = mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => {
    const url = new URL(String(input), "https://example.test");
    requests.push(url);
    const filter = url.searchParams.get("cloudbase_uid") ?? "";
    const batch = filter.startsWith("in.(") ? filter.slice(4, -1).split(",") : [filter.slice(3)];
    return Response.json(batch.map((id) => ({ cloudbase_uid: id, name: id, avatar: null })));
  });
  try {
    const profiles = await fetchPublicProfiles([...ids, ids[0], ids[200]]);
    assert.equal(Object.keys(profiles).length, 201);
    assert.equal(requests.length, 3, "a profile read per author must be replaced with batches");
    for (const request of requests) {
      assert.equal(request.searchParams.get("select"), "cloudbase_uid,name,avatar");
      assert.equal(request.searchParams.get("limit"), "100");
    }
    assert.equal(profiles["user-200"].id, "user-200");
  } finally { spy.mock.restore(); }
});

test("later profile-batch failure rejects instead of returning incomplete authors", async () => {
  const { fetchPublicProfiles } = await import("../src/lib/public-profiles");
  let requests = 0;
  const spy = mock.method(globalThis, "fetch", async () => {
    if (++requests === 2) return Response.json({ message: "profile service unavailable" }, { status: 400 });
    return Response.json([]);
  });
  try {
    await assert.rejects(fetchPublicProfiles(Array.from({ length: 101 }, (_, index) => `user-${index}`)), /profile service unavailable/);
  } finally { spy.mock.restore(); }
});

test("long encoded author IDs stay below the proxy query-length ceiling", async () => {
  const { fetchPublicProfiles } = await import("../src/lib/public-profiles");
  const spy = mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => {
    assert.ok(new URL(String(input), "https://example.test").search.length <= 8192);
    return Response.json([]);
  });
  try {
    await fetchPublicProfiles(Array.from({ length: 101 }, (_, index) => `${"中".repeat(100)}-${index}`));
    assert.ok(spy.mock.callCount() > 1);
  } finally { spy.mock.restore(); }
});
