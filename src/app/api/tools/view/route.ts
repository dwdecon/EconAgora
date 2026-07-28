import { NextRequest, NextResponse } from "next/server";
import { incrementNumericCounter } from "@/lib/rdb-counters";
import { serverDb } from "@/lib/rdb-server";

export async function POST(request: NextRequest) {
  try {
    const { toolId } = (await request.json()) as { toolId?: string };
    if (!toolId) {
      return NextResponse.json({ error: "Missing tool ID." }, { status: 400 });
    }

    const { data: tool, error } = await serverDb
      .from("tool")
      .select("_id")
      .eq("_id", toolId)
      .eq("status", "PUBLISHED")
      .single();

    if (error || !tool) {
      return NextResponse.json({ error: "Tool not found." }, { status: 404 });
    }

    const counterUpdate = await incrementNumericCounter("tool", toolId, "view_count", 1);
    if (counterUpdate.error) {
      console.error("Failed to increment tool view count:", counterUpdate.error);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to increment tool view count:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
