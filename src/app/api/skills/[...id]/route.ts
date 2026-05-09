import { NextRequest, NextResponse } from "next/server";
import { incrementNumericCounter } from "@/lib/rdb-counters";
import { serverDb } from "@/lib/rdb-server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string[] }> },
) {
  try {
    const { id: idParts } = await params;

    if (idParts.length < 2) {
      return NextResponse.json({ error: "Invalid skill path." }, { status: 400 });
    }

    const action = idParts[idParts.length - 1];
    const skillId = idParts.slice(0, -1).join("/");

    if (action === "view") {
      const { data: skill, error } = await serverDb
        .from("skill")
        .select("_id")
        .eq("_id", skillId)
        .eq("status", "PUBLISHED")
        .single();

      if (error || !skill) {
        return NextResponse.json({ error: "Skill not found." }, { status: 404 });
      }

      const counterUpdate = await incrementNumericCounter("skill", skillId, "view_count", 1);
      if (counterUpdate.error) {
        console.error("Failed to increment view count:", counterUpdate.error);
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 404 });
  } catch (error) {
    console.error("Failed to process skill API request:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
