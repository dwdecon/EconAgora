import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, it, mock } from "node:test";
import { NextRequest } from "next/server";
import sharp from "sharp";
import { AUTH_COOKIE, signSessionToken } from "../src/lib/auth-local";
import { POST as avatar } from "../src/app/api/profile/avatar/route";

process.env.JWT_SECRET = "avatar-tests-only-32-bytes-or-longer";
let directory: string;
let sequence = 0;
before(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), "econagora-avatar-"));
  process.env.AVATAR_DIR = directory;
  const writeFile = fs.writeFile;
  const mkdir = fs.mkdir;
  mock.method(fs, "writeFile", async (...args: Parameters<typeof writeFile>) => {
    assert.ok(path.resolve(String(args[0])).startsWith(directory + path.sep), "Avatar writes must stay in the test directory");
    return writeFile(...args);
  });
  mock.method(fs, "mkdir", async (...args: Parameters<typeof mkdir>) => {
    assert.equal(path.resolve(String(args[0])), directory, "Avatar directories must stay isolated");
    return mkdir(...args);
  });
});
after(async () => { mock.restoreAll(); await rm(directory, { recursive: true, force: true }); });

async function upload(file: File) {
  const form = new FormData();
  form.set("file", file);
  // A server receives serialized multipart bytes, not Undici's outbound FormData producer.
  const multipart = new Response(form);
  const bytes = await multipart.arrayBuffer();
  const token = signSessionToken({ id: `avatar-user-${sequence++}`, email: "user@example.test", displayName: "User" });
  return new NextRequest("https://econagora.test/api/profile/avatar", {
    method: "POST", headers: {
      Cookie: `${AUTH_COOKIE}=${token}`,
      "Content-Type": multipart.headers.get("content-type")!,
    }, body: bytes,
  });
}

it("rejects HTML that merely claims to be an image without creating a file", async () => {
  const response = await avatar(await upload(new File(["<script>alert('unsafe')</script>"], "avatar.png", { type: "image/png" })));
  assert.equal(response.status, 400);
  assert.deepEqual(await readdir(directory), []);
});

it("enforces the whole multipart body limit before parsing it", async () => {
  const request = await upload(new File([new Uint8Array(6 * 1024 * 1024)], "avatar.png", { type: "image/png" }));
  const response = await avatar(request);
  assert.equal(response.status, 413);
  assert.deepEqual(await readdir(directory), []);
});

it("re-encodes decoded images as bounded WebP files with safe random filenames", async () => {
  const input = await sharp({ create: { width: 1000, height: 800, channels: 3, background: "red" } }).png().toBuffer();
  const response = await avatar(await upload(new File([new Uint8Array(input)], "../../payload.html", { type: "image/png" })));
  assert.equal(response.status, 200);
  const { url } = await response.json();
  assert.match(url, /^\/static-files\/avatars\/[a-f0-9-]+\.webp$/);
  const files = await readdir(directory);
  assert.equal(files.length, 1);
  const result = await sharp(await readFile(path.join(directory, files[0]))).metadata();
  assert.equal(result.format, "webp");
  assert.ok(result.width! <= 512 && result.height! <= 512);
});
