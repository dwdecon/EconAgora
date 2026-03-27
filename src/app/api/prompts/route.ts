import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
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
    const category = typeof body?.category === "string" ? body.category.trim() : "";
    const description =
      typeof body?.description === "string" && body.description.trim()
        ? body.description.trim()
        : null;
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    const locale = typeof body?.locale === "string" && body.locale.trim()
      ? body.locale.trim()
      : "zh";
    const tags = normalizeTags(body?.tags);

    if (!title) {
      return badRequest("Prompt title is required.");
    }

    if (!category) {
      return badRequest("Prompt category is required.");
    }

    if (!content) {
      return badRequest("Prompt content is required.");
    }

    const promptId = createId("prompt");
    const now = toSqlTimestamp();
    const payload = {
      _id: promptId,
      _openid: auth.user.id,
      title,
      category,
      tags: JSON.stringify(tags),
      description,
      content,
      locale,
      status: "PUBLISHED",
      author_id: auth.user.id,
      like_count: 0,
      download_count: 0,
      created_at: now,
      updated_at: now,
    };

    const { error } = await serverDb.from("prompt").insert(payload);
    if (error) {
      console.error("Failed to create prompt:", error);
      return serverError("Failed to create prompt.");
    }

    return NextResponse.json({ id: promptId });
  } catch (error) {
    console.error("Failed to parse prompt payload:", error);
    return badRequest("Invalid prompt payload.");
  }
}
