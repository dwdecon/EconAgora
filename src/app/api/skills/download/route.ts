import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const folder = searchParams.get("folder");
  const slug = searchParams.get("slug");

  if (!folder || !slug) {
    return new NextResponse("Missing folder or slug", { status: 400 });
  }

  try {
    const url = `https://raw.githubusercontent.com/meleantonio/awesome-econ-ai-stuff/main/_skills/${folder}/${slug}/SKILL.md`;
    const response = await fetch(url, {
      headers: {
        Accept: "text/plain",
        "User-Agent": "AI4Econ",
      },
    });

    if (!response.ok) {
      return new NextResponse("Skill file not found", { status: 404 });
    }

    const content = await response.text();
    const filename = `${slug}.md`;

    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Failed to download skill", { status: 500 });
  }
}
