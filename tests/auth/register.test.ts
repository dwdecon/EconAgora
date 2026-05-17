import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  completeEmailPasswordRegistration,
  isPasswordMissingError,
  startEmailPasswordRegistration,
  type CloudBaseAuthLike,
} from "../../src/lib/auth/register";

function createAuth(overrides: Partial<CloudBaseAuthLike> = {}) {
  const calls: Array<{ method: string; params?: unknown }> = [];

  const auth: CloudBaseAuthLike = {
    async getVerification(params) {
      calls.push({ method: "getVerification", params });
      return { verification_id: "verification-id", is_user: false };
    },
    async verify(params) {
      calls.push({ method: "verify", params });
      return { verification_token: "verification-token" };
    },
    async resetPassword(params) {
      calls.push({ method: "resetPassword", params });
      return {};
    },
    async signInWithPassword(params) {
      calls.push({ method: "signInWithPassword", params });
      return { data: { session: { access_token: "token" } }, error: null };
    },
    async signOut() {
      calls.push({ method: "signOut" });
      return {};
    },
    oauthInstance: {
      authApi: {
        async signUp(params) {
          calls.push({ method: "authApi.signUp", params });
          return {};
        },
      },
    },
    ...overrides,
  };

  return { auth, calls };
}

describe("email password registration", () => {
  it("starts registration by sending one email verification code", async () => {
    const { auth, calls } = createAuth({
      async getVerification(params) {
        calls.push({ method: "getVerification", params });
        return { verification_id: "email-code", is_user: true };
      },
    });

    const draft = await startEmailPasswordRegistration(auth, {
      email: " user@example.com ",
      password: "secret123",
      displayName: " Ada ",
    });

    assert.deepEqual(draft, {
      email: "user@example.com",
      password: "secret123",
      displayName: "Ada",
      verificationId: "email-code",
      isExistingUser: true,
    });
    assert.deepEqual(calls, [
      { method: "getVerification", params: { email: "user@example.com", target: "ANY" } },
    ]);
  });

  it("creates a new email account with the verified email token and then proves password login works", async () => {
    const { auth, calls } = createAuth();
    const draft = await startEmailPasswordRegistration(auth, {
      email: "new@example.com",
      password: "secret123",
      displayName: "New User",
    });

    await completeEmailPasswordRegistration(auth, draft, "654321");

    assert.deepEqual(calls.map((call) => call.method), [
      "getVerification",
      "verify",
      "authApi.signUp",
      "signOut",
      "signInWithPassword",
    ]);
    assert.deepEqual(calls[2].params, {
      email: "new@example.com",
      username: "new@example.com",
      password: "secret123",
      name: "New User",
      nickname: "New User",
      verification_code: "654321",
      verification_token: "verification-token",
    });
    assert.deepEqual(calls[4].params, { email: "new@example.com", password: "secret123" });
  });

  it("sets a password for an existing OTP-only email account instead of failing with password not set", async () => {
    const { auth, calls } = createAuth({
      async getVerification(params) {
        calls.push({ method: "getVerification", params });
        return { verification_id: "existing-code", is_user: true };
      },
    });
    const draft = await startEmailPasswordRegistration(auth, {
      email: "existing@example.com",
      password: "secret123",
      displayName: "Existing User",
    });

    await completeEmailPasswordRegistration(auth, draft, "123456");

    assert.deepEqual(calls.map((call) => call.method), [
      "getVerification",
      "verify",
      "resetPassword",
      "signOut",
      "signInWithPassword",
    ]);
    assert.deepEqual(calls[2].params, {
      email: "existing@example.com",
      new_password: "secret123",
      verification_token: "verification-token",
    });
  });

  it("fails explicitly if the direct CloudBase email sign-up API is unavailable", async () => {
    const { auth } = createAuth({ oauthInstance: undefined });
    const draft = await startEmailPasswordRegistration(auth, {
      email: "new@example.com",
      password: "secret123",
      displayName: "New User",
    });

    await assert.rejects(
      () => completeEmailPasswordRegistration(auth, draft, "123456"),
      /direct email sign-up API is unavailable/,
    );
  });

  it("treats CloudBase password-not-set responses as the known missing-password state", () => {
    assert.equal(isPasswordMissingError("账号密码未设置"), true);
    assert.equal(isPasswordMissingError("password not set"), true);
    assert.equal(isPasswordMissingError("invalid password"), false);
  });
});
