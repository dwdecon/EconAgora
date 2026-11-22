import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, mock, test } from "node:test";
import { NextRequest } from "next/server";

const originalCwd = process.cwd();
const originalDataDir = process.env.BLOG_VIEW_DATA_DIR;
const redirects: Array<{ mock: { restore(): void } }> = [];
let root: string;
let dataDir: string;
let route: typeof import("../src/app/api/blog/view/route");

before(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), "econagora-views-"));
  dataDir = path.join(root, "data/blog-views");
  await fs.mkdir(dataDir, { recursive: true });
  for (const status of ["published", "draft"]) {
    const directory = path.join(root, "content/blog", status);
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, "index.zh.md"), `---\nslug: ${status}\nstatus: ${status}\ntitle: ${status}\n---\nText`);
  }
  process.chdir(root);
  process.env.BLOG_VIEW_DATA_DIR = dataDir;

  // Redirect the historical absolute directory before importing the old route.
  // This lets the regression exercise real files without touching its data.
  const legacyDir = path.join("/var/www/EconAgora", "data/blog-views");
  const redirect = (value: unknown) => typeof value === "string" && value.startsWith(legacyDir)
    ? path.join(dataDir, path.relative(legacyDir, value)) : value;
  for (const method of ["readFile", "writeFile", "mkdir"] as const) {
    const original = fs[method].bind(fs) as (...args: unknown[]) => Promise<unknown>;
    redirects.push(mock.method(fs, method, ((...args: unknown[]) => original(redirect(args[0]), ...args.slice(1))) as never));
  }
  route = await import("../src/app/api/blog/view/route");
});

after(async () => {
  for (const redirect of redirects) redirect.mock.restore();
  process.chdir(originalCwd);
  if (originalDataDir === undefined) delete process.env.BLOG_VIEW_DATA_DIR;
  else process.env.BLOG_VIEW_DATA_DIR = originalDataDir;
  await fs.rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});

function viewRequest(slug: string, address = "192.0.2.1") {
  return new NextRequest("https://example.test/api/blog/view", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": address },
    body: JSON.stringify({ slug }),
  });
}

test("simultaneous blog views preserve every distinct visitor increment", async () => {
  const responses = await Promise.all(Array.from({ length: 24 }, (_, index) =>
    route.POST(viewRequest("published", `192.0.2.${index + 1}`))
  ));
  assert.ok(responses.every((response) => response.status === 200));
  const response = await route.GET(new NextRequest("https://example.test/api/blog/view?slug=published"));
  assert.equal((await response.json()).views, 24);
  assert.equal(JSON.parse(await fs.readFile(path.join(dataDir, "views.json"), "utf8")).published.views, 24);
});

test("unknown, draft, and prototype-like slugs cannot create view records", async () => {
  for (const slug of ["missing", "draft"]) {
    assert.equal((await route.POST(viewRequest(slug))).status, 404);
  }
  for (const slug of ["__proto__", "constructor", "../published", "a".repeat(201)]) {
    assert.equal((await route.POST(viewRequest(slug))).status, 400);
  }
  const records = JSON.parse(await fs.readFile(path.join(dataDir, "views.json"), "utf8"));
  assert.deepEqual(Object.keys(records), ["published"]);
});

test("malformed and oversized view payloads return client errors", async () => {
  const malformed = new NextRequest("https://example.test/api/blog/view", { method: "POST", body: "{" });
  assert.equal((await route.POST(malformed)).status, 400);
  const oversized = new NextRequest("https://example.test/api/blog/view", {
    method: "POST", body: JSON.stringify({ slug: "published", unused: "x".repeat(10_000) }),
  });
  assert.equal((await route.POST(oversized)).status, 413);
});

test("a repeated visitor cannot inflate the same article in a short window", async () => {
  const first = await route.POST(viewRequest("published", "192.0.2.99"));
  assert.equal(first.status, 200);
  assert.equal((await route.POST(viewRequest("published", "192.0.2.99"))).status, 429);
});

test("corrupt view storage is never silently replaced with a new counter", async () => {
  const storagePath = path.join(dataDir, "views.json");
  await fs.writeFile(storagePath, "{not valid json");
  assert.equal((await route.POST(viewRequest("published", "192.0.2.100"))).status, 500);
  assert.equal(await fs.readFile(storagePath, "utf8"), "{not valid json");
});
