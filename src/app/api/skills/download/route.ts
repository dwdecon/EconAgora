import { NextRequest, NextResponse } from "next/server";

const MAX_SKILL_BYTES = 1024 * 1024;
const SAFE_SEGMENT = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const folder = searchParams.get("folder");
  const slug = searchParams.get("slug");

  if (!folder || !slug || !SAFE_SEGMENT.test(folder) || !SAFE_SEGMENT.test(slug)) {
    return new NextResponse("Missing folder or slug", { status: 400 });
  }

  try {
    const url = `https://raw.githubusercontent.com/meleantonio/awesome-econ-ai-stuff/main/_skills/${folder}/${slug}/SKILL.md`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      redirect: "error",
      headers: {
        Accept: "text/plain",
        "User-Agent": "AI4Econ",
      },
    });

    if (!response.ok) {
      return new NextResponse("Skill file not found", { status: 404 });
    }

    if (Number(response.headers.get("Content-Length")) > MAX_SKILL_BYTES) {
      await response.body?.cancel();
      return new NextResponse("Skill file is too large", { status: 502 });
    }
    if (!response.body) return new NextResponse("Skill file not found", { status: 404 });
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        totalBytes += value.byteLength;
        if (totalBytes > MAX_SKILL_BYTES) {
          await reader.cancel();
          return new NextResponse("Skill file is too large", { status: 502 });
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    const content = Buffer.concat(chunks, totalBytes).toString("utf-8");
    const filename = `${slug}.md`;

    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Failed to download skill", { status: 502 });
  }
}
