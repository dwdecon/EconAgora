import assert from "node:assert/strict";
import { describe, it } from "node:test";
import jwt from "jsonwebtoken";
import {
  AUTH_COOKIE,
  hashPassword,
  sessionCookieOptions,
  signSessionToken,
  verifyPassword,
  verifySessionToken,
} from "../src/lib/auth-local";
import { requireCloudBaseUser } from "../src/lib/cloudbase-server-auth";

const secret = "local-security-tests-only-32-bytes-or-longer";
process.env.JWT_SECRET = secret;
const user = { id: "test-user", email: "researcher@example.test", displayName: "Researcher" };

describe("session authentication boundaries", () => {
  it("continues accepting existing locally issued user sessions", () => {
    assert.deepEqual(verifySessionToken(signSessionToken(user)), user);
  });

  it("does not accept a database service token as a user session", () => {
    const token = jwt.sign({ sub: "server", role: "authenticated", svc: "server" }, secret, { expiresIn: "1h" });
    assert.equal(verifySessionToken(token), null);
  });

  it("rejects signed tokens that have no expiry", () => {
    assert.equal(verifySessionToken(jwt.sign({ sub: user.id, role: "authenticated" }, secret)), null);
  });

  it("rejects signed tokens for a different database role", () => {
    const token = jwt.sign({ sub: user.id, role: "anon" }, secret, { expiresIn: "1h" });
    assert.equal(verifySessionToken(token), null);
  });

  it("keeps the browser session inaccessible to document.cookie", () => {
    assert.equal(sessionCookieOptions().httpOnly, true);
  });

  it("authenticates the HttpOnly session cookie for existing protected routes", async () => {
    const request = new Request("https://econagora.test/api/profile", {
      headers: { Cookie: `${AUTH_COOKIE}=${signSessionToken(user)}` },
    });
    const auth = await requireCloudBaseUser(request);
    assert.ok("user" in auth);
    assert.equal(auth.user?.id, user.id);
  });

  it("rejects cross-origin mutations even when a valid cookie is attached", async () => {
    const request = new Request("https://econagora.test/api/profile", {
      method: "POST",
      headers: {
        Cookie: `${AUTH_COOKIE}=${signSessionToken(user)}`,
        Origin: "https://other.example.test",
      },
    });
    const auth = await requireCloudBaseUser(request);
    assert.ok("response" in auth);
    assert.equal(auth.response?.status, 403);
  });

  it("keeps legitimate Bearer scripts working without an Origin header", async () => {
    const request = new Request("https://econagora.test/api/posts", {
      method: "POST",
      headers: { Authorization: `Bearer ${signSessionToken(user)}` },
    });
    const auth = await requireCloudBaseUser(request);
    assert.ok("user" in auth);
    assert.equal(auth.user?.id, user.id);
  });

  it("accepts the public HTTP authority when Next uses a loopback request URL", async () => {
    const request = new Request("https://127.0.0.1:3000/api/profile", {
      method: "POST",
      headers: {
        Host: "econagora.test",
        Origin: "https://econagora.test",
        Cookie: `${AUTH_COOKIE}=${signSessionToken(user)}`,
      },
    });
    const auth = await requireCloudBaseUser(request);
    assert.ok("user" in auth);
    assert.equal(auth.user.id, user.id);
  });

  it("prefers a cookie over an unrelated Bearer identity", async () => {
    const other = { ...user, id: "other-user" };
    const request = new Request("https://econagora.test/api/profile", {
      headers: {
        Cookie: `${AUTH_COOKIE}=${signSessionToken(user)}`,
        Authorization: `Bearer ${signSessionToken(other)}`,
      },
    });
    const auth = await requireCloudBaseUser(request);
    assert.ok("user" in auth);
    assert.equal(auth.user?.id, user.id);
  });
});

describe("password verification", () => {
  it("preserves existing scrypt hashes and rejects a wrong password", async () => {
    const stored = await hashPassword("existing-test-password");
    assert.equal(await verifyPassword("existing-test-password", stored), true);
    assert.equal(await verifyPassword("wrong-test-password", stored), false);
  });

  it("returns false for invalid stored scrypt parameters instead of throwing", async () => {
    assert.equal(await verifyPassword("password", "scrypt$1$8$1$0011$ffee"), false);
  });

  it("does not block the event loop while deriving a password hash", async () => {
    let timerRan = false;
    const timer = setTimeout(() => { timerRan = true; }, 0);
    try {
      await hashPassword("non-blocking-test-password");
      assert.equal(timerRan, true);
    } finally {
      clearTimeout(timer);
    }
  });
});
