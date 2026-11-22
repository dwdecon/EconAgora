import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  getUserDisplayName,
  requireCloudBaseUser,
  serverError,
} from "@/lib/cloudbase-server-auth";
import { createId, toSqlTimestamp } from "@/lib/rdb-utils";
import { serverDb } from "@/lib/rdb-server";
import { boundedTags, rateLimit, readJsonBody } from "@/lib/request-security";

export async function POST(request: NextRequest) {
  const auth = await requireCloudBaseUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const parsed = await readJsonBody(request, 512 * 1024);
    if ("response" in parsed) return parsed.response;
    const { body } = parsed;
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    const locale = typeof body?.locale === "string" && body.locale.trim()
      ? body.locale.trim()
      : "zh";
    const tags = boundedTags(body.tags);

    if (title.length > 200 || content.length > 100_000 || !tags || !["zh", "en"].includes(locale)) {
      return badRequest("Invalid or oversized post fields.");
    }

    if (!title) {
      return badRequest("Post title is required.");
    }

    if (!content) {
      return badRequest("Post content is required.");
    }
    const limited = rateLimit(`publish-post:${auth.user.id}`, 10, 60_000);
    if (limited) return limited;

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
