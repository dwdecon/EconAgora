import { NextRequest, NextResponse } from "next/server";
import { badRequest, requireCloudBaseUser, serverError } from "@/lib/cloudbase-server-auth";
import { rateLimit, readBodyBytes } from "@/lib/request-security";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import sharp from "sharp";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_BODY_SIZE = MAX_FILE_SIZE + 64 * 1024;
const ALLOWED_FORMATS = new Set(["jpeg", "png", "gif", "webp"]);
let activeUploads = 0;

export async function POST(request: NextRequest) {
  const auth = await requireCloudBaseUser(request);
  if ("response" in auth) return auth.response;
  const limited = rateLimit(`avatar:${auth.user.id}`, 10, 60 * 60_000);
  if (limited) return limited;
  if (activeUploads >= 2) {
    return NextResponse.json({ error: "Uploads are busy. Please try again later." }, {
      status: 429, headers: { "Retry-After": "5" },
    });
  }
  activeUploads++;
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!/^multipart\/form-data\s*;/i.test(contentType)) return badRequest("A multipart image upload is required.");
    const input = await readBodyBytes(request, MAX_BODY_SIZE);
    if ("response" in input) return input.response;
    const formData = await new Response(input.bytes, { headers: { "Content-Type": contentType } }).formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return badRequest("No image file provided.");
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum size is 5MB." }, { status: 413 });
    }
    let image: Buffer;
    try {
      const decoder = sharp(Buffer.from(await file.arrayBuffer()), {
        limitInputPixels: 16_000_000, animated: false, failOn: "warning",
      });
      const metadata = await decoder.metadata();
      if (!metadata.format || !ALLOWED_FORMATS.has(metadata.format)) return badRequest("Unsupported image format.");
      image = await decoder.rotate().resize(512, 512, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 }).toBuffer();
    } catch {
      return badRequest("Invalid or oversized image.");
    }
    const filename = `${randomUUID()}.webp`;
    const directory = process.env.AVATAR_DIR || "/var/www/static/avatars";
    try {
      await mkdir(directory, { recursive: true });
      await writeFile(path.join(directory, filename), image, { flag: "wx", mode: 0o644 });
    } catch {
      console.error("Avatar storage failed.");
      return serverError("Failed to upload avatar.");
    }
    return NextResponse.json({ url: `/static-files/avatars/${filename}` });
  } catch {
    return badRequest("Invalid upload request.");
  } finally {
    activeUploads--;
  }
}
