import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { RdbQueryBuilder } from "../src/lib/rdb";

// These tests exercise actual query serialization and response normalization.
// Returning only the first page, swallowing a later error, or ignoring the
// overall row budget would each break a distinct assertion below.
async function readRows(total: number, maxRows?: number, failedOffset?: number) {
  const { queryAllPages } = await import("../src/lib/rdb-pagination");
  const offsets: number[] = [];
  const spy = mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => {
    const url = new URL(String(input));
    assert.equal(url.searchParams.get("target_id"), "eq.thread");
    const offset = Number(url.searchParams.get("offset"));
    const limit = Number(url.searchParams.get("limit"));
    offsets.push(offset);
    if (offset === failedOffset) return Response.json({ message: "second page unavailable" }, { status: 400 });
    return Response.json(Array.from({ length: Math.max(0, Math.min(limit, total - offset)) }, (_, i) => ({ _id: offset + i })));
  });
  try {
    const rows = await queryAllPages<{ _id: number }>(() => new RdbQueryBuilder<{ _id: number }[]>(
      "comment", "https://pagination.example.test", "test-token",
    ).select("_id").eq("target_id", "thread").order("_id"), { maxRows });
    return { rows, offsets };
  } finally { spy.mock.restore(); }
}

test("complete filtered reads preserve 51 and 201 rows", async () => {
  for (const total of [0, 51, 200, 201]) {
    const { rows, offsets } = await readRows(total);
    assert.equal(rows.length, total);
    assert.equal(rows.at(-1)?._id, total ? total - 1 : undefined);
    assert.deepEqual(offsets, total >= 200 ? [0, 200] : [0]);
  }
});

test("an error on a subsequent page rejects instead of reporting partial success", async () => {
  await assert.rejects(readRows(201, undefined, 200), /second page unavailable/);
});

test("the overall row budget rejects overflow while accepting an exact boundary", async () => {
  await assert.rejects(readRows(202, 201), /limit|budget/i);
  assert.equal((await readRows(201, 201)).rows.length, 201);
});
