import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  requireCloudBaseUser,
  serverError,
} from "@/lib/cloudbase-server-auth";
import { createId, toSqlTimestamp } from "@/lib/rdb-utils";
import { serverDb } from "@/lib/rdb-server";

export async function POST(request: NextRequest) {
  const auth = await requireCloudBaseUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const now = toSqlTimestamp();
    const payload = {
      name: typeof body?.name === "string" ? body.name.trim() : "",
      role:
        typeof body?.role === "string" && body.role.trim()
          ? body.role.trim()
          : "USER",
      locale:
        typeof body?.locale === "string" && body.locale.trim()
          ? body.locale.trim()
          : "zh",
      updated_at: now,
    };

    if (!payload.name) {
      return badRequest("Profile name is required.");
    }

    const { data: existingProfile, error: lookupError } = await serverDb
      .from("user_profile")
      .select("_id")
      .eq("cloudbase_uid", auth.user.id)
      .single();

    if (lookupError && lookupError.raw) {
      const rawMessage = JSON.stringify(lookupError.raw);
      if (!rawMessage.includes("0 rows") && !rawMessage.includes("PGRST116")) {
        console.error("Failed to lookup user profile:", lookupError);
        return serverError("Failed to save profile.");
      }
    }

    if (existingProfile) {
      const { error } = await serverDb
        .from("user_profile")
        .update(payload)
        .eq("cloudbase_uid", auth.user.id);

      if (error) {
        console.error("Failed to update user profile:", error);
        return serverError("Failed to save profile.");
      }
    } else {
      const { error } = await serverDb.from("user_profile").insert({
        _id: createId("profile"),
        _openid: auth.user.id,
        cloudbase_uid: auth.user.id,
        ...payload,
        created_at: now,
      });

      if (error) {
        console.error("Failed to create user profile:", error);
        return serverError("Failed to save profile.");
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to parse profile payload:", error);
    return badRequest("Invalid profile payload.");
  }
}
