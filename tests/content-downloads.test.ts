import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { NextRequest } from "next/server";
import { GET as downloadSkill } from "../src/app/api/skills/download/route";
import { GET as downloadPrompt } from "../src/app/api/prompts/[id]/download/route";
import { POST as viewSkill } from "../src/app/api/skills/[...id]/route";
import { serverDb } from "../src/lib/rdb-server";

test("invalid and excessive skill paths are rejected before accessing the database", async () => {
  const databaseSpy = mock.method(serverDb, "from", () => { throw new Error("must not query for an invalid path"); });
  try {
    for (const id of [["..", "view"], ["folder", "../outside", "view"], ["a".repeat(1000), "view"], [...Array(100).fill("folder"), "view"]]) {
      const response = await viewSkill(new NextRequest("https://example.test/api/skills/invalid/view", { method: "POST" }), {
        params: Promise.resolve({ id }),
      });
      assert.equal(response.status, 400);
    }
    assert.equal(databaseSpy.mock.callCount(), 0);
  } finally {
    databaseSpy.mock.restore();
  }
});

test("skill downloads reject traversal and header injection before fetching upstream", async () => {
  const fetchSpy = mock.method(globalThis, "fetch", async () => new Response("unexpected content"));
  try {
    for (const parameters of [
      { folder: "../..", slug: "README" },
      { folder: "research", slug: "../../README" },
      { folder: "research", slug: "name\r\nInjected: value" },
      { folder: "research", slug: "name?other-file" },
    ]) {
      const query = new URLSearchParams(parameters);
      const response = await downloadSkill(new NextRequest(`https://example.test/api/skills/download?${query}`));
      assert.equal(response.status, 400);
    }
    assert.equal(fetchSpy.mock.callCount(), 0);
  } finally {
    fetchSpy.mock.restore();
  }
});

test("skill downloads reject oversized upstream responses instead of buffering them", async () => {
  const fetchSpy = mock.method(globalThis, "fetch", async () => new Response("untrusted body", {
    headers: { "Content-Length": "2097152" },
  }));
  try {
    const response = await downloadSkill(new NextRequest("https://example.test/api/skills/download?folder=research&slug=example"));
    assert.equal(response.status, 502);
  } finally {
    fetchSpy.mock.restore();
  }
});

test("skill downloads stop a chunked response once its byte budget is exceeded", async () => {
  let cancelled = false;
  let chunks = 0;
  const fetchSpy = mock.method(globalThis, "fetch", async () => new Response(new ReadableStream({
    pull(controller) {
      if (chunks++ < 3) controller.enqueue(new Uint8Array(600_000));
      else controller.close();
    },
    cancel() { cancelled = true; },
  })));
  try {
    const response = await downloadSkill(new NextRequest("https://example.test/api/skills/download?folder=research&slug=example"));
    assert.equal(response.status, 502);
    assert.equal(cancelled, true);
  } finally {
    fetchSpy.mock.restore();
  }
});

test("valid skill downloads retain text and attachment metadata", async () => {
  const fetchSpy = mock.method(globalThis, "fetch", async () => new Response("# Example skill"));
  try {
    const response = await downloadSkill(new NextRequest("https://example.test/api/skills/download?folder=research&slug=example-skill"));
    assert.equal(response.status, 200);
    assert.equal(await response.text(), "# Example skill");
    assert.match(response.headers.get("Content-Disposition") || "", /example-skill\.md/);
    const [url, options] = fetchSpy.mock.calls[0].arguments;
    assert.equal(String(url), "https://raw.githubusercontent.com/meleantonio/awesome-econ-ai-stuff/main/_skills/research/example-skill/SKILL.md");
    assert.ok(options?.signal, "upstream requests need a bounded lifetime");
  } finally {
    fetchSpy.mock.restore();
  }
});

test("Chinese prompt titles produce a valid UTF-8 download filename", async () => {
  const query = {
    select() { return this; },
    eq() { return this; },
    update() { return this; },
    async single() {
      return { data: { _id: "test-prompt", title: "经济研究", content: "Some prompt", download_count: 0 }, error: null };
    },
  };
  const databaseSpy = mock.method(serverDb, "from", () => query as never);
  try {
    const response = await downloadPrompt(new NextRequest("https://example.test/api/prompts/test-prompt/download"), {
      params: Promise.resolve({ id: "test-prompt" }),
    });
    assert.equal(response.status, 200);
    assert.equal(await response.text(), "# 经济研究\n\nSome prompt");
    const disposition = response.headers.get("Content-Disposition") || "";
    assert.match(disposition, /filename="[\x20-\x7e]+"/);
    assert.match(disposition, /filename\*=UTF-8''%E7%BB%8F%E6%B5%8E%E7%A0%94%E7%A9%B6\.txt/);
  } finally {
    databaseSpy.mock.restore();
  }
});
