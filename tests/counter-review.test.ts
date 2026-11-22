import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { syncLikeCount } from "../src/lib/rdb-counters";

process.env.JWT_SECRET = "counter-review-tests-only-32-bytes-or-longer";
process.env.RDB_BASE_URL = "http://counter-review.example.test";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => { resolve = done; });
  return { promise, resolve };
}

const nextTurn = () => new Promise<void>((resolve) => { setImmediate(resolve); });

test("the entire like count and update operation is ordered for one target", async () => {
  const started = deferred();
  const gate = deferred();
  let countReads = 0;
  let counter = 0;
  const spy = mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    assert.equal(url.hostname, "counter-review.example.test");
    if (url.pathname === "/user_like") {
      const snapshot = ++countReads;
      if (snapshot === 1) {
        started.resolve();
        await gate.promise;
      }
      return Response.json([{ _id: "like" }], { headers: { "Content-Range": `0-0/${snapshot}` } });
    }
    if (init?.method === "PATCH") {
      assert.equal(url.searchParams.get("like_count"), `eq.${counter}`);
      counter = JSON.parse(String(init.body)).like_count;
    }
    return Response.json({ _id: "ordered", like_count: counter });
  });
  const first = syncLikeCount("post", "ordered", "POST");
  await started.promise;
  const second = syncLikeCount("post", "ordered", "POST");
  try {
    await nextTurn();
    gate.resolve();
    const results = await Promise.all([first, second]);
    assert.equal(results[1].value, 2);
    assert.equal(counter, 2, "an old count must not replace a more recent aggregate");
  } finally {
    gate.resolve();
    await Promise.allSettled([first, second]);
    spy.mock.restore();
  }
});

test("a slow target does not block synchronization of a different target", async () => {
  const started = deferred();
  const gate = deferred();
  const counters = new Map<string, number>();
  const spy = mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const id = (url.searchParams.get("target_id") ?? url.searchParams.get("_id"))!.slice(3);
    if (url.pathname === "/user_like") {
      if (id === "slow") {
        started.resolve();
        await gate.promise;
      }
      return Response.json([{ _id: "like" }], { headers: { "Content-Range": "0-0/1" } });
    }
    if (init?.method === "PATCH") counters.set(id, JSON.parse(String(init.body)).like_count);
    return Response.json({ _id: id, like_count: counters.get(id) ?? 0 });
  });
  const slow = syncLikeCount("post", "slow", "POST");
  await started.promise;
  try {
    assert.equal((await syncLikeCount("post", "independent", "POST")).value, 1);
  } finally {
    gate.resolve();
    await slow;
    spy.mock.restore();
  }
});

test("a target remains locked until its counter write has completed", async () => {
  const patchStarted = deferred();
  const gate = deferred();
  let counter = 0;
  let countReads = 0;
  let patchCount = 0;
  const spy = mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    if (url.pathname === "/user_like") {
      const count = ++countReads;
      return Response.json([{ _id: "like" }], { headers: { "Content-Range": `0-0/${count}` } });
    }
    if (init?.method === "PATCH") {
      if (++patchCount === 1) {
        patchStarted.resolve();
        await gate.promise;
      }
      counter = JSON.parse(String(init.body)).like_count;
    }
    return Response.json({ _id: "pending-write", like_count: counter });
  });
  const first = syncLikeCount("post", "pending-write", "POST");
  await patchStarted.promise;
  const second = syncLikeCount("post", "pending-write", "POST");
  try {
    await nextTurn();
    assert.equal(countReads, 1, "a queued count must wait for the previous write, not just its count");
    gate.resolve();
    await Promise.all([first, second]);
    assert.equal(counter, 2);
  } finally {
    gate.resolve();
    await Promise.allSettled([first, second]);
    spy.mock.restore();
  }
});

test("a thrown synchronization does not retain or poison its target queue", async () => {
  const secret = process.env.JWT_SECRET;
  let counter = 0;
  const spy = mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    if (url.pathname === "/user_like") {
      return Response.json([{ _id: "like" }], { headers: { "Content-Range": "0-0/1" } });
    }
    if (init?.method === "PATCH") counter = JSON.parse(String(init.body)).like_count;
    return Response.json({ _id: "recoverable", like_count: counter });
  });
  try {
    delete process.env.JWT_SECRET;
    await assert.rejects(syncLikeCount("post", "recoverable", "POST"), /JWT_SECRET/);
    process.env.JWT_SECRET = secret;
    assert.equal((await syncLikeCount("post", "recoverable", "POST")).value, 1);
  } finally {
    process.env.JWT_SECRET = secret;
    spy.mock.restore();
  }
});

test("target queues have bounded cardinality and completed queues free their slots", async () => {
  const gate = deferred();
  const counters = new Map<string, number>();
  let countRequests = 0;
  const spy = mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const id = (url.searchParams.get("target_id") ?? url.searchParams.get("_id"))!.slice(3);
    if (url.pathname === "/user_like") {
      countRequests++;
      await gate.promise;
      return Response.json([{ _id: "like" }], { headers: { "Content-Range": "0-0/1" } });
    }
    if (init?.method === "PATCH") counters.set(id, JSON.parse(String(init.body)).like_count);
    return Response.json({ _id: id, like_count: counters.get(id) ?? 0 });
  });
  const pending = Array.from({ length: 1024 }, (_, index) => syncLikeCount("post", `capacity-${index}`, "POST"));
  await nextTurn();
  const overflow = syncLikeCount("post", "overflow", "POST");
  try {
    const response = await Promise.race([
      overflow,
      new Promise<null>((resolve) => { setTimeout(() => resolve(null), 50); }),
    ]);
    assert.ok(response?.error, "a full queue table must reject excess targets instead of retaining more promises");
    assert.equal(countRequests, 1024);
    gate.resolve();
    const results = await Promise.all(pending);
    assert.ok(results.every((result) => result.value === 1));
    assert.equal((await syncLikeCount("post", "after-cleanup", "POST")).value, 1);
  } finally {
    gate.resolve();
    await Promise.allSettled([...pending, overflow]);
    spy.mock.restore();
  }
});
