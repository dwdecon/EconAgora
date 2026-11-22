import assert from "node:assert/strict";
import { mock, test } from "node:test";

Object.defineProperty(globalThis, "window", { value: new EventTarget(), configurable: true });

test("optional session discovery safely returns null on a temporary network failure", async () => {
  const { getSession, getSessionUser } = await import("../src/lib/cloudbase");
  const fetchSpy = mock.method(globalThis, "fetch", async () => { throw new TypeError("test network unavailable"); });
  try {
    for (const discover of [getSession, getSessionUser]) {
      const result = await discover().then(
        (session) => ({ session, error: null }),
        (error: unknown) => ({ session: undefined, error }),
      );
      assert.equal(result.error, null);
      assert.equal(result.session, null);
    }
  } finally {
    fetchSpy.mock.restore();
  }
});

test("explicit getUser returns a recognizable error without rejecting on a network failure", async () => {
  const { auth } = await import("../src/lib/cloudbase");
  const fetchSpy = mock.method(globalThis, "fetch", async () => { throw new TypeError("test network unavailable"); });
  try {
    const result = await auth.getUser().then(
      (value: { data: { user: unknown }; error: { message: string } | null }) => ({ value, rejected: false }),
      () => ({ value: null, rejected: true }),
    );
    assert.equal(result.rejected, false);
    assert.equal(result.value?.data.user, null);
    assert.ok(result.value?.error?.message);
  } finally {
    fetchSpy.mock.restore();
  }
});

test("a session request started before successful logout cannot return the previous identity afterwards", async () => {
  const { auth, getSessionUser } = await import("../src/lib/cloudbase");
  let finishMe!: (response: Response) => void;
  const pendingMe = new Promise<Response>((resolve) => { finishMe = resolve; });
  const fetchSpy = mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => {
    if (String(input) === "/api/auth/me") return pendingMe;
    if (String(input) === "/api/auth/logout") return Response.json({ success: true });
    throw new Error("unexpected test request");
  });
  try {
    const checking = getSessionUser();
    assert.equal((await auth.signOut()).error, null);
    finishMe(Response.json({ user: { id: "previous-user", displayName: "Previous" } }));
    assert.equal(await checking, null);
  } finally {
    fetchSpy.mock.restore();
  }
});

test("a session request started before successful login yields the new identity instead of a late previous identity", async () => {
  const { auth, getSessionUser } = await import("../src/lib/cloudbase");
  let finishMe!: (response: Response) => void;
  const pendingMe = new Promise<Response>((resolve) => { finishMe = resolve; });
  const fetchSpy = mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => {
    if (String(input) === "/api/auth/me") return pendingMe;
    if (String(input) === "/api/auth/login") return Response.json({ user: { id: "new-user", displayName: "New" } });
    throw new Error("unexpected test request");
  });
  try {
    const checking = getSessionUser();
    assert.equal((await auth.signInWithPassword({ email: "new@example.test", password: "fixture password" })).error, null);
    finishMe(Response.json({ user: { id: "previous-user", displayName: "Previous" } }));
    assert.equal((await checking)?.id, "new-user");
  } finally {
    fetchSpy.mock.restore();
  }
});

test("a failed logout leaves the in-flight current identity usable", async () => {
  const { auth, getSessionUser } = await import("../src/lib/cloudbase");
  let finishMe!: (response: Response) => void;
  const pendingMe = new Promise<Response>((resolve) => { finishMe = resolve; });
  const fetchSpy = mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => {
    if (String(input) === "/api/auth/me") return pendingMe;
    if (String(input) === "/api/auth/logout") return Response.json({ error: "Unavailable" }, { status: 503 });
    throw new Error("unexpected test request");
  });
  try {
    const checking = getSessionUser();
    assert.ok((await auth.signOut()).error);
    finishMe(Response.json({ user: { id: "still-current", displayName: "Current" } }));
    assert.equal((await checking)?.id, "still-current");
  } finally {
    fetchSpy.mock.restore();
  }
});
