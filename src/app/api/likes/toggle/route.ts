import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  requireCloudBaseUser,
  serverError,
} from "@/lib/cloudbase-server-auth";
import { syncLikeCount } from "@/lib/rdb-counters";
import { createId, toSqlTimestamp } from "@/lib/rdb-utils";
import { serverDb } from "@/lib/rdb-server";

type TargetType = "POST" | "PROMPT" | "SKILL" | "TOOL";

export async function POST(request: NextRequest) {
  const auth = await requireCloudBaseUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const targetType = normalizeTargetType(body?.targetType);
    const targetId = typeof body?.targetId === "string" ? body.targetId.trim() : "";

    if (!targetType) {
      return badRequest("Invalid like target type.");
    }

    if (!targetId) {
      return badRequest("Like target ID is required.");
    }

    const targetValidation = await validateLikeTarget(targetType, targetId);
    if (targetValidation.error) {
      return targetValidation.error;
    }

    const { table: targetTable } = targetValidation;

    const { data: existingLike, error: likeLookupError } = await serverDb
      .from("user_like")
      .select("_id")
      .eq("user_id", auth.user.id)
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .single();

    if (likeLookupError && likeLookupError.raw) {
      const rawMessage = JSON.stringify(likeLookupError.raw);
      if (!rawMessage.includes("0 rows") && !rawMessage.includes("PGRST116")) {
        console.error("Failed to lookup like row:", likeLookupError);
        return serverError("Failed to toggle like.");
      }
    }

    const now = toSqlTimestamp();

    if (existingLike) {
      const { error: deleteError } = await serverDb
        .from("user_like")
        .delete()
        .eq("user_id", auth.user.id)
        .eq("target_type", targetType)
        .eq("target_id", targetId);

      if (deleteError) {
        console.error("Failed to remove like:", deleteError);
        return serverError("Failed to toggle like.");
      }

      const syncedCount = await syncLikeCount(targetTable, targetId, targetType);
      if (syncedCount.error || syncedCount.value === null) {
        console.error("Failed to sync like count:", syncedCount.error);
        return serverError("Failed to toggle like.");
      }

      return NextResponse.json({
        liked: false,
        likeCount: syncedCount.value,
      });
    }

    const { error: insertError } = await serverDb.from("user_like").insert({
      _id: createId("like"),
      _openid: auth.user.id,
      user_id: auth.user.id,
      target_type: targetType,
      target_id: targetId,
      created_at: now,
    });

    if (insertError && !isDuplicateLikeError(insertError)) {
      console.error("Failed to insert like row:", insertError);
      return serverError("Failed to toggle like.");
    }

    const syncedCount = await syncLikeCount(targetTable, targetId, targetType);
    if (syncedCount.error || syncedCount.value === null) {
      console.error("Failed to sync like count:", syncedCount.error);
      return serverError("Failed to toggle like.");
    }

    return NextResponse.json({
      liked: true,
      likeCount: syncedCount.value,
    });
  } catch (error) {
    console.error("Failed to parse like payload:", error);
    return badRequest("Invalid like payload.");
  }
}

function normalizeTargetType(value: unknown): TargetType | null {
  return value === "POST" || value === "PROMPT" || value === "SKILL" || value === "TOOL"
    ? value
    : null;
}

function isDuplicateLikeError(error: { message: string; raw?: unknown }) {
  const message = JSON.stringify(error.raw ?? error.message);
  return (
    message.includes("Duplicate entry") &&
    message.includes("user_like.uk_user_target")
  );
}

async function validateLikeTarget(targetType: TargetType, targetId: string) {
  const table: "post" | "prompt" | "skill" | "tool" =
    targetType === "POST"
      ? "post"
      : targetType === "PROMPT"
        ? "prompt"
        : targetType === "SKILL"
          ? "skill"
          : "tool";

  let query = serverDb.from(table).select("_id").eq("_id", targetId);
  if (table !== "post") {
    query = query.eq("status", "PUBLISHED");
  }

  const { data, error } = await query.single();
  if (error || !data) {
    return {
      table,
      error: NextResponse.json({ error: "Like target not found." }, { status: 404 }),
    };
  }

  return { table, error: null };
}
