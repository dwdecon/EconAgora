import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, mock, test } from "node:test";
import {
  coverExists,
  getAllBlogSlugs,
  getBlogPostBySlug,
  getBlogPosts,
  getSeriesDefinitions,
  parseBlogFile,
} from "../src/lib/blog-data";

const originalCwd = process.cwd();
let root: string;
function markdown(slug: string, status = "published", title = slug) {
  return `---\nslug: ${slug}\ntitle: ${title}\nstatus: ${status}\ndate: 2026-10-01\ntags: []\n---\nBody\n`;
}

before(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), "econagora-content-"));
  for (const status of ["published", "draft", "archived"]) {
    const directory = path.join(root, "content/blog", status);
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, "index.zh.md"), markdown(status, status));
  }
  await fs.mkdir(path.join(root, "outside"));
  await fs.writeFile(path.join(root, "outside/index.zh.md"), markdown("outside"));
  await fs.writeFile(path.join(root, "outside.txt"), "not a public cover");
  await fs.mkdir(path.join(root, "public"));
  await fs.writeFile(path.join(root, "content/blog/series.yaml"), "series:\n  - id: first\n    name: First\n");
  process.chdir(root);
});

after(async () => {
  process.chdir(originalCwd);
  await fs.rm(root, { recursive: true, force: true });
});

test("public blog listing excludes archived and draft posts", async () => {
  assert.deepEqual((await getBlogPosts()).map((post) => post.slug), ["published"]);
});

test("unpublished posts cannot be loaded directly or generated as public slugs", async () => {
  assert.equal(await getBlogPostBySlug("draft"), null);
  assert.equal(await getBlogPostBySlug("archived"), null);
  assert.deepEqual(await getAllBlogSlugs(), [{ slug: "published", locale: "zh" }]);
});

test("blog slugs and locales cannot escape the content directory", async () => {
  assert.equal(await getBlogPostBySlug("../../outside"), null);
  assert.equal(await getBlogPostBySlug("published", "../../outside/index.zh"), null);
});

test("English requests retain the Chinese fallback when no translation exists", async () => {
  assert.equal((await getBlogPostBySlug("published", "en"))?.locale, "zh");
});

test("cover existence does not expose files outside public", () => {
  assert.equal(coverExists("../outside.txt"), false);
});

test("unchanged markdown and YAML are read once and content edits invalidate the cache", async () => {
  const markdownPath = path.join(root, "content/blog/published/index.zh.md");
  // Use a fresh file that earlier route checks have not cached.
  const freshPath = path.join(root, "content/blog/published/cache.zh.md");
  await fs.writeFile(freshPath, markdown("cache"));
  const readFile = fs.readFile.bind(fs);
  let markdownReads = 0;
  let yamlReads = 0;
  const spy = mock.method(fs, "readFile", async (...args: Parameters<typeof fs.readFile>) => {
    if (String(args[0]) === freshPath) markdownReads += 1;
    if (String(args[0]).endsWith("series.yaml")) yamlReads += 1;
    return readFile(...args);
  });
  try {
    await Promise.all([parseBlogFile(freshPath), parseBlogFile(freshPath)]);
    await parseBlogFile(freshPath);
    await getSeriesDefinitions();
    await getSeriesDefinitions();
    assert.equal(markdownReads, 1);
    assert.equal(yamlReads, 1);
    await fs.writeFile(freshPath, markdown("cache", "published", "Updated title"));
    assert.equal((await parseBlogFile(freshPath))?.frontmatter.title, "Updated title");
    assert.equal(markdownReads, 2);
    assert.ok(await fs.stat(markdownPath));
  } finally {
    spy.mock.restore();
  }
});
