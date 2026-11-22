import assert from "node:assert/strict";
import { test } from "node:test";

const events = new EventTarget();
Object.defineProperty(globalThis, "window", { value: events, configurable: true });
Object.defineProperty(globalThis, "document", {
  value: { get cookie() { throw new Error("Client code must not read the session cookie"); } },
  configurable: true,
});

test("client session discovery uses the HttpOnly cookie without reading document.cookie", async () => {
  const { getSession } = await import("../src/lib/cloudbase");
  const original = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ user: { id: "u1", email: "u@example.com", displayName: "U" } });
  try {
    const session = await getSession();
    assert.equal(session?.user.id, "u1");
    assert.equal(Object.hasOwn(session ?? {}, "access_token"), false);
  } finally { globalThis.fetch = original; }
});

test("simultaneous client user checks share one request, without caching stale authentication", async () => {
  const { auth, getSessionUser } = await import("../src/lib/cloudbase");
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    await Promise.resolve();
    return Response.json({ user: { id: "u1", displayName: "U" } });
  };
  try {
    const users = await Promise.all([getSessionUser(), auth.getUser(), getSessionUser()]);
    assert.equal(calls, 1);
    assert.equal(users[0]?.id, "u1");
    await getSessionUser();
    assert.equal(calls, 2);
  } finally { globalThis.fetch = original; }
});

test("failed server logout does not falsely announce a successful sign-out", async () => {
  const { auth } = await import("../src/lib/cloudbase");
  const original = globalThis.fetch;
  let signouts = 0;
  const listener = () => { signouts += 1; };
  events.addEventListener("econagora-auth-change", listener);
  globalThis.fetch = async () => Response.json({ error: "Unavailable" }, { status: 503 });
  try {
    assert.ok((await auth.signOut()).error);
    assert.equal(signouts, 0);
  } finally {
    events.removeEventListener("econagora-auth-change", listener);
    globalThis.fetch = original;
  }
});
