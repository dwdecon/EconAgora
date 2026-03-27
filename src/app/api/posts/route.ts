import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  getUserDisplayName,
  requireCloudBaseUser,
  serverError,
} from "@/lib/cloudbase-server-auth";
import { createId, normalizeTags, toSqlTimestamp } from "@/lib/rdb-utils";
import { serverDb } from "@/lib/rdb-server";

export async function POST(request: NextRequest) {
  const auth = await requireCloudBaseUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    const locale = typeof body?.locale === "string" && body.locale.trim()
      ? body.locale.trim()
      : "zh";
    const tags = normalizeTags(body?.tags);

    if (!title) {
      return badRequest("Post title is required.");
    }

    if (!content) {
      return badRequest("Post content is required.");
    }

    const postId = createId("post");
    const now = toSqlTimestamp();
    const payload = {
      _id: postId,
      _openid: auth.user.id,
      title,
      content,
      tags: JSON.stringify(tags),
      locale,
      pinned: false,
      is_agent_post: false,
      like_count: 0,
      author_id: auth.user.id,
      created_at: now,
      updated_at: now,
    };

    const { error } = await serverDb.from("post").insert(payload);
    if (error) {
      console.error("Failed to create post:", error);
      return serverError("Failed to create post.");
    }

    return NextResponse.json({
      id: postId,
      post: {
        id: postId,
        title,
        content,
        tags,
        created_at: now,
        author: {
          id: auth.user.id,
          name: getUserDisplayName(auth.user),
          avatar: auth.user.picture,
        },
      },
    });
  } catch (error) {
    console.error("Failed to parse post payload:", error);
    return badRequest("Invalid post payload.");
  }
}
