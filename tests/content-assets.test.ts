import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";

const execute = promisify(execFile);
const copyScript = path.resolve("scripts/copy-standalone-assets.mjs");

async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "econagora-assets-"));
  await fs.mkdir(path.join(root, ".next/standalone"), { recursive: true });
  for (const directory of ["public", ".next/static", "content/blog"]) {
    await fs.mkdir(path.join(root, directory), { recursive: true });
    await fs.writeFile(path.join(root, directory, "asset.txt"), "public content", { mode: 0o600 });
  }
  return root;
}

test("standalone copying excludes environment files and repository metadata", async () => {
  const root = await fixture();
  try {
    await fs.writeFile(path.join(root, "content/.env"), "fixture only", { mode: 0o600 });
    await fs.mkdir(path.join(root, "public/.git"));
    await fs.writeFile(path.join(root, "public/.git/config"), "fixture only", { mode: 0o600 });
    await execute(process.execPath, [copyScript], { cwd: root });
    for (const relative of ["content/.env", "public/.git"]) {
      assert.equal(await fs.stat(path.join(root, ".next/standalone", relative)).then(() => true, () => false), false);
    }
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("standalone assets do not retain symlinks to files outside the public content roots", async () => {
  const root = await fixture();
  try {
    const privateDirectory = path.join(root, "private-config");
    await fs.mkdir(privateDirectory);
    await fs.writeFile(path.join(privateDirectory, "private.txt"), "fixture only", { mode: 0o600 });
    await fs.symlink(privateDirectory, path.join(root, "public/external"), process.platform === "win32" ? "junction" : "dir");
    await execute(process.execPath, [copyScript], { cwd: root });
    assert.equal(await fs.lstat(path.join(root, ".next/standalone/public/external")).then(() => true, () => false), false);
    assert.equal(await fs.readFile(path.join(root, ".next/standalone/content/blog/asset.txt"), "utf8"), "public content");
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("standalone public content is service-readable without changing source permissions", {
  skip: process.platform === "win32" ? "POSIX permission bits require a Linux runner" : false,
}, async () => {
  const root = await fixture();
  try {
    await fs.chmod(path.join(root, "content/blog"), 0o700);
    await execute(process.execPath, [copyScript], { cwd: root });
    for (const directory of ["public", ".next/static", "content/blog"]) {
      assert.equal((await fs.stat(path.join(root, ".next/standalone", directory))).mode & 0o777, 0o755);
      assert.equal((await fs.stat(path.join(root, ".next/standalone", directory, "asset.txt"))).mode & 0o777, 0o644);
      assert.equal((await fs.stat(path.join(root, directory, "asset.txt"))).mode & 0o777, 0o600);
    }
    assert.equal((await fs.stat(path.join(root, "content/blog"))).mode & 0o777, 0o700);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
