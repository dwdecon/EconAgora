import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
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
    const category = typeof body?.category === "string" ? body.category.trim() : "";
    const description =
      typeof body?.description === "string" && body.description.trim()
        ? body.description.trim()
        : null;
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    const locale = typeof body?.locale === "string" && body.locale.trim()
      ? body.locale.trim()
      : "zh";
    const tags = boundedTags(body.tags);

    if (title.length > 200 || category.length > 100 || (description?.length ?? 0) > 2000 ||
        content.length > 100_000 || !tags || !["zh", "en"].includes(locale)) {
      return badRequest("Invalid or oversized prompt fields.");
    }

    if (!title) {
      return badRequest("Prompt title is required.");
    }

    if (!category) {
      return badRequest("Prompt category is required.");
    }

    if (!content) {
      return badRequest("Prompt content is required.");
    }
    const limited = rateLimit(`publish-prompt:${auth.user.id}`, 10, 60_000);
    if (limited) return limited;

    const promptId = createId("prompt");
    const now = toSqlTimestamp();
    const payload = {
      _id: promptId,
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
