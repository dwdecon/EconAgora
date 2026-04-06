import { NextRequest, NextResponse } from "next/server";
import { incrementNumericCounter } from "@/lib/rdb-counters";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing prompt ID." }, { status: 400 });
    }

    const counterUpdate = await incrementNumericCounter("prompt", id, "view_count", 1);
    if (counterUpdate.error) {
      console.error("Failed to increment view count:", counterUpdate.error);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to increment view count:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
