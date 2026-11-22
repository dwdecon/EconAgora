import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it } from "node:test";
import { NextRequest } from "next/server";
import { AUTH_COOKIE, hashPassword, signSessionToken, verifyPassword } from "../src/lib/auth-local";
import { POST as login } from "../src/app/api/auth/login/route";
import { POST as register } from "../src/app/api/auth/register/route";
import { POST as update } from "../src/app/api/auth/update/route";
import { POST as logout } from "../src/app/api/auth/logout/route";
import { GET as me } from "../src/app/api/auth/me/route";
import { POST as chat } from "../src/app/api/chat/completions/route";

process.env.JWT_SECRET = "local-route-tests-only-32-bytes-or-longer";
process.env.RDB_BASE_URL = "http://database.example.test";
const originalFetch = globalThis.fetch;
const user = { id: "route-test-user", email: "user@example.test", displayName: "User" };
const password = "existing-test-password";
let storedHash: string;
let requests: Array<{ url: URL; method: string; body: Record<string, unknown> | null }>;
let providerBody: Record<string, unknown> | undefined;
let providerSignal: AbortSignal | null | undefined;
let requestId = 1;

function request(path: string, body?: unknown, headers: Record<string, string> = {}) {
  return new NextRequest(`https://econagora.test${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Real-IP": `192.0.2.${requestId++}`,
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function sessionHeaders(id = user.id) {
  return { Cookie: `${AUTH_COOKIE}=${signSessionToken({ ...user, id })}` };
}

before(async () => { storedHash = await hashPassword(password); });
beforeEach(() => {
  requests = [];
  providerBody = undefined;
  providerSignal = undefined;
  process.env.DEEPSEEK_API_KEY = "test-only-not-a-provider-key";
  globalThis.fetch = async (input, init) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    const method = init?.method ?? "GET";
    const body = typeof init?.body === "string" ? JSON.parse(init.body) : null;
    requests.push({ url, method, body });
    if (url.hostname === "api.deepseek.com") {
      providerBody = body;
      providerSignal = init?.signal;
      return Response.json({ choices: [{ message: { role: "assistant", content: "Done" } }] });
    }
    assert.equal(url.hostname, "database.example.test", "Unexpected network destination");
    if (method === "PATCH" || method === "POST") return new Response(null, { status: 204 });
    if (url.pathname === "/auth_users") {
      const email = url.searchParams.get("email");
      return Response.json(email && email !== `eq.${user.email}` ? [] : [{
        id: user.id, email: user.email, password_hash: storedHash,
      }]);
    }
    if (url.pathname === "/user_profile") return Response.json([{ name: user.displayName }]);
    assert.fail(`Unexpected database path: ${url.pathname}`);
  };
});
afterEach(() => { globalThis.fetch = originalFetch; });

describe("authentication HTTP boundaries", () => {
  it("logs in with the existing password format and sets an HttpOnly cookie", async () => {
    const response = await login(request("/api/auth/login", { email: user.email, password }));
    assert.equal(response.status, 200);
    assert.match(response.headers.get("set-cookie") ?? "", /HttpOnly/i);
    assert.equal((await response.json()).user.id, user.id);
  });

  it("rejects incorrect passwords after asynchronous verification", async () => {
    const response = await login(request("/api/auth/login", { email: user.email, password: "wrong-password" }));
    assert.equal(response.status, 401);
  });

  it("blocks login CSRF before reading account data", async () => {
    const response = await login(request("/api/auth/login", { email: user.email, password }, {
      Origin: "https://other.example.test",
    }));
    assert.equal(response.status, 403);
    assert.equal(requests.length, 0);
  });

  it("blocks registration CSRF before writing an account", async () => {
    const response = await register(request("/api/auth/register", {
      email: "new@example.test", password,
    }, { Origin: "https://other.example.test" }));
    assert.equal(response.status, 403);
    assert.equal(requests.length, 0);
  });

  it("blocks cross-origin sign-out requests", async () => {
    const response = await logout(request("/api/auth/logout", {}, {
      Origin: "https://other.example.test",
    }));
    assert.equal(response.status, 403);
    assert.equal(response.headers.has("set-cookie"), false);
  });

  it("rejects oversized streamed login bodies before querying the database", async () => {
    const response = await login(request("/api/auth/login", {
      email: user.email, password, padding: "x".repeat(20_000),
    }));
    assert.equal(response.status, 413);
    assert.equal(requests.length, 0);
  });

  it("rejects cross-site simple text bodies instead of parsing them as JSON", async () => {
    const response = await login(request("/api/auth/login", { email: user.email, password }, {
      "Content-Type": "text/plain",
    }));
    assert.equal(response.status, 415);
    assert.equal(requests.length, 0);
  });

  it("rejects an excessively long password before performing work", async () => {
    const response = await login(request("/api/auth/login", {
      email: user.email, password: "a".repeat(1025),
    }));
    assert.equal(response.status, 400);
    assert.equal(requests.length, 0);
  });

  it("requires the current password before sensitive account changes", async () => {
    const response = await update(request("/api/auth/update", {
      password: "new-test-password",
    }, sessionHeaders()));
    assert.equal(response.status, 400);
    assert.equal(requests.filter((entry) => entry.method === "PATCH").length, 0);
  });

  it("does not update credentials when the current password is wrong", async () => {
    const response = await update(request("/api/auth/update", {
      password: "new-test-password", currentPassword: "wrong-password",
    }, sessionHeaders()));
    assert.equal(response.status, 403);
    assert.equal(requests.filter((entry) => entry.method === "PATCH").length, 0);
  });

  it("validates all changes before updating either password or email", async () => {
    const response = await update(request("/api/auth/update", {
      password: "new-test-password", email: "invalid-email", currentPassword: password,
    }, sessionHeaders()));
    assert.equal(response.status, 400);
    assert.equal(requests.filter((entry) => entry.method === "PATCH").length, 0);
  });

  it("updates validated password and email in one database operation", async () => {
    const response = await update(request("/api/auth/update", {
      password: "new-test-password", email: "new@example.test", currentPassword: password,
    }, sessionHeaders()));
    assert.equal(response.status, 200);
    const writes = requests.filter((entry) => entry.method === "PATCH");
    assert.equal(writes.length, 1);
    assert.equal(writes[0].body?.email, "new@example.test");
    assert.equal(await verifyPassword("new-test-password", writes[0].body?.password_hash as string), true);
  });

  it("marks session identity responses as non-cacheable", async () => {
    const response = await me(request("/api/auth/me", undefined, sessionHeaders()));
    assert.equal(response.status, 200);
    assert.match(response.headers.get("cache-control") ?? "", /no-store/i);
  });

  it("never writes a session cookie during an identity read", async () => {
    const response = await me(request("/api/auth/me", undefined, sessionHeaders()));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("set-cookie"), null);
    assert.equal((await response.json()).user.id, user.id);
  });
});

describe("AI request boundaries without paid network calls", () => {
  it("fails closed when the provider key is absent", async () => {
    delete process.env.DEEPSEEK_API_KEY;
    const response = await chat(request("/api/chat/completions", {
      messages: [{ role: "user", content: "Hello" }],
    }, sessionHeaders("ai-no-key")));
    assert.equal(response.status, 503);
    assert.equal(requests.length, 0);
  });

  it("rejects invalid message roles without calling the provider", async () => {
    const response = await chat(request("/api/chat/completions", {
      messages: [{ role: "invalid-role", content: "Hello" }],
    }, sessionHeaders("ai-invalid-role")));
    assert.equal(response.status, 400);
    assert.equal(requests.length, 0);
  });

  it("rejects oversized AI bodies before forwarding them", async () => {
    const response = await chat(request("/api/chat/completions", {
      messages: [{ role: "user", content: "x".repeat(300_000) }],
    }, sessionHeaders("ai-large-body")));
    assert.equal(response.status, 413);
    assert.equal(requests.length, 0);
  });

  it("caps provider output and forwards only supported input fields", async () => {
    const response = await chat(request("/api/chat/completions", {
      messages: [{ role: "user", content: "Hello" }],
      max_tokens: 1_000_000, n: 50, base_url: "https://other.example.test",
    }, sessionHeaders("ai-bound-output")));
    assert.equal(response.status, 200);
    assert.ok(typeof providerBody?.max_tokens === "number" && providerBody.max_tokens <= 8192);
    assert.equal(providerBody?.n, undefined);
    assert.equal(providerBody?.base_url, undefined);
    assert.ok(providerSignal instanceof AbortSignal);
  });

  it("limits repeated AI calls for the same authenticated user", async () => {
    const statuses: number[] = [];
    for (let index = 0; index < 11; index++) {
      const response = await chat(request("/api/chat/completions", {
        messages: [{ role: "user", content: "Hello" }],
      }, sessionHeaders("ai-rate-test")));
      statuses.push(response.status);
      if (response.status === 429) {
        assert.ok(Number(response.headers.get("retry-after")) > 0);
        break;
      }
    }
    assert.ok(statuses.includes(429));
    assert.ok(requests.length <= 10);
  });

  it("rejects overlapping AI calls and releases the slot after completion", async () => {
    let release!: () => void;
    let started!: () => void;
    const waiting = new Promise<void>((resolve) => { started = resolve; });
    const pending = new Promise<void>((resolve) => { release = resolve; });
    let calls = 0;
    globalThis.fetch = async () => {
      calls++;
      if (calls === 1) {
        started();
        await pending;
      }
      return Response.json({ choices: [{ message: { role: "assistant", content: "Done" } }] });
    };
    const makeRequest = () => request("/api/chat/completions", {
      messages: [{ role: "user", content: "Hello" }],
    }, sessionHeaders("ai-concurrent"));
    const first = chat(makeRequest());
    await waiting;
    try {
      const overlapping = await chat(makeRequest());
      assert.equal(overlapping.status, 429);
      assert.equal(calls, 1);
    } finally {
      release();
    }
    assert.equal((await first).status, 200);
    assert.equal((await chat(makeRequest())).status, 200);
  });

  it("preserves Page Agent tool-call history and normalizes its JSON fallback response", async () => {
    const argumentsJson = JSON.stringify({ action: { done: { text: "Done" } }, next_goal: "Finish" });
    globalThis.fetch = async (_input, init) => {
      const sent = JSON.parse(init?.body as string);
      assert.equal(sent.messages[1].tool_calls[0].function.name, "AgentOutput");
      assert.equal(sent.messages[2].tool_call_id, "previous-call");
      assert.equal(sent.tools[0].function.name, "AgentOutput");
      return Response.json({ choices: [{ message: { content: argumentsJson, reasoning_content: "Private reasoning" } }] });
    };
    const response = await chat(request("/api/chat/completions", {
      messages: [
        { role: "user", content: "Finish" },
        { role: "assistant", content: null, tool_calls: [{ id: "previous-call", type: "function", function: { name: "AgentOutput", arguments: "{}" } }] },
        { role: "tool", content: "Success", tool_call_id: "previous-call" },
      ],
      tools: [{ type: "function", function: { name: "AgentOutput", parameters: { type: "object" } } }],
    }, sessionHeaders("ai-tool-compatibility")));
    assert.equal(response.status, 200);
    const message = (await response.json()).choices[0].message;
    assert.equal(message.reasoning_content, undefined);
    assert.equal(message.content, null);
    assert.equal(message.tool_calls[0].function.arguments, argumentsJson);
  });
});
