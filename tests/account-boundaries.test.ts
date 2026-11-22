import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { signSessionToken } from "../src/lib/auth-local";

process.env.JWT_SECRET = "test-only-account-regression-key";

test("email compatibility endpoint requires reauthentication instead of forwarding local tokens to CloudBase", async () => {
  const { POST } = await import("../src/app/api/profile/email/route");
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; return Response.json({}); };
  try {
    const token = signSessionToken({ id: "email-test", email: "old@example.com", displayName: "User" });
    const response = await POST(new NextRequest("https://econagora.com/api/profile/email", {
      method: "POST", headers: { cookie: `econagora_jwt=${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email: "new@example.com" }),
    }));
    assert.equal(response.status, 400);
    assert.equal(calls, 0);
  } finally { globalThis.fetch = original; }
});

test("login redirects only target a local path", async () => {
  const { safeRedirectPath } = await import("../src/lib/auth/redirect");
  for (const input of ["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "/\nevil"]) {
    assert.equal(safeRedirectPath(input), "/");
  }
  assert.equal(safeRedirectPath("/en/account?tab=security#email"), "/en/account?tab=security#email");
});
