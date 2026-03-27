import { NextRequest, NextResponse } from "next/server";
import { incrementNumericCounter } from "@/lib/rdb-counters";
import { serverDb } from "@/lib/rdb-server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing prompt ID." }, { status: 400 });
    }

    const { data: prompt, error } = await serverDb
      .from("prompt")
      .select("_id,title,content,download_count")
      .eq("_id", id)
      .single();

    if (error || !prompt) {
      return NextResponse.json({ error: "Prompt not found." }, { status: 404 });
    }

    const counterUpdate = await incrementNumericCounter("prompt", id, "download_count", 1);
    if (counterUpdate.error) {
      console.error("Failed to increment download count:", counterUpdate.error);
    }

    const title = typeof (prompt as any).title === "string" ? (prompt as any).title : "Untitled Prompt";
    const content = typeof (prompt as any).content === "string" ? (prompt as any).content : "";
    const fileContent = `# ${title}\n\n${content}`;
    const safeTitle = title
      .replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, "_")
      .slice(0, 50);
    const filename = `${safeTitle || "prompt"}.txt`;

    return new NextResponse(fileContent, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": Buffer.byteLength(fileContent).toString(),
      },
    });
  } catch (error) {
    console.error("Failed to download prompt:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
