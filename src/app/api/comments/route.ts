import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  getUserDisplayName,
  requireCloudBaseUser,
  serverError,
} from "@/lib/cloudbase-server-auth";
import { createId, toSqlTimestamp } from "@/lib/rdb-utils";
import { serverDb } from "@/lib/rdb-server";

type TargetType = "POST" | "PROMPT";

export async function POST(request: NextRequest) {
  const auth = await requireCloudBaseUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const targetType = normalizeTargetType(body?.targetType);
    const targetId = typeof body?.targetId === "string" ? body.targetId.trim() : "";
    const parentId = typeof body?.parentId === "string" && body.parentId.trim()
      ? body.parentId.trim()
      : null;
    const content = typeof body?.content === "string" ? body.content.trim() : "";

    if (!targetType) {
      return badRequest("Invalid comment target type.");
    }

    if (!targetId) {
      return badRequest("Comment target ID is required.");
    }

    if (!content) {
      return badRequest("Comment content is required.");
    }

    const targetTable = targetType === "POST" ? "post" : "prompt";
    const { data: targetRow, error: targetError } = await serverDb
      .from(targetTable)
      .select("_id")
      .eq("_id", targetId)
      .single();

    if (targetError || !targetRow) {
      return NextResponse.json({ error: "Comment target not found." }, { status: 404 });
    }

    if (parentId) {
      const { data: parentComment, error: parentError } = await serverDb
        .from("comment")
        .select("_id,target_id,target_type")
        .eq("_id", parentId)
        .single();

      if (parentError || !parentComment) {
        return NextResponse.json({ error: "Reply target not found." }, { status: 404 });
      }

      if (
        (parentComment as any).target_id !== targetId ||
        (parentComment as any).target_type !== targetType
      ) {
        return badRequest("Reply target does not belong to the same thread.");
      }
    }

    const commentId = createId("comment");
    const now = toSqlTimestamp();
    const payload: Record<string, unknown> = {
      _id: commentId,
      _openid: auth.user.id,
      author_id: auth.user.id,
      target_type: targetType,
      target_id: targetId,
      content,
      is_agent_comment: false,
      created_at: now,
      updated_at: now,
    };

    if (parentId) {
      payload.parent_id = parentId;
    }

    const { error } = await serverDb.from("comment").insert(payload);
    if (error) {
      console.error("Failed to create comment:", error);
      return serverError("Failed to create comment.");
    }

    const { data: profile } = await serverDb
      .from("user_profile")
      .select("name,avatar")
      .eq("cloudbase_uid", auth.user.id)
      .single();

    return NextResponse.json({
      comment: {
        id: commentId,
        content,
        created_at: now,
        is_agent_comment: false,
        user_id: auth.user.id,
        author: {
          id: auth.user.id,
          name:
            typeof (profile as any)?.name === "string" && (profile as any).name.trim()
              ? (profile as any).name
              : getUserDisplayName(auth.user),
          avatar:
            typeof (profile as any)?.avatar === "string"
              ? (profile as any).avatar
              : auth.user.picture,
        },
        replies: [],
      },
    });
  } catch (error) {
    console.error("Failed to parse comment payload:", error);
    return badRequest("Invalid comment payload.");
  }
}

function normalizeTargetType(value: unknown): TargetType | null {
  return value === "POST" || value === "PROMPT" ? value : null;
}
