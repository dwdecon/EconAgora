import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  requireCloudBaseUser,
  serverError,
} from "@/lib/cloudbase-server-auth";
import { createId, toSqlTimestamp } from "@/lib/rdb-utils";
import { serverDb } from "@/lib/rdb-server";

export async function GET(request: NextRequest) {
  const auth = await requireCloudBaseUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const rawFields = searchParams.get("fields");
  const requestedFields = rawFields
    ? rawFields.split(",").map((f) => f.trim()).filter(Boolean)
    : null;

  const profileFields = ["name", "avatar", "affiliation", "bio", "locale"];
  const fieldsToFetch = requestedFields
    ? profileFields.filter((f) => requestedFields.includes(f))
    : profileFields;

  const selectFields = ["cloudbase_uid", ...fieldsToFetch];

  try {
    const { data: profile, error } = await serverDb
      .from("user_profile")
      .select(selectFields.join(","))
      .eq("cloudbase_uid", auth.user.id)
      .single();

    if (error && error.raw) {
      const rawMessage = JSON.stringify(error.raw);
      if (!rawMessage.includes("0 rows") && !rawMessage.includes("PGRST116")) {
        console.error("Failed to fetch user profile:", error);
        return serverError("Failed to fetch profile.");
      }
    }

    if (!profile) {
      return NextResponse.json({ profile: null });
    }

    return NextResponse.json({
      profile: {
        name: profile.name ?? "",
        avatar: profile.avatar ?? null,
        affiliation: profile.affiliation ?? "",
        bio: profile.bio ?? "",
        locale: profile.locale ?? "zh",
        email: auth.user.email,
      },
    });
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return serverError("Failed to fetch profile.");
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCloudBaseUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const now = toSqlTimestamp();
    const payload: Record<string, unknown> = {
      name: typeof body?.name === "string" ? body.name.trim() : "",
      locale: normalizeProfileLocale(body?.locale),
      updated_at: now,
    };

    if (typeof body?.affiliation === "string") {
      payload.affiliation = body.affiliation.trim();
    }
    if (typeof body?.bio === "string") {
      payload.bio = body.bio.trim();
    }
    if (typeof body?.avatar === "string" && body.avatar) {
      payload.avatar = body.avatar.trim();
    }

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

function normalizeProfileLocale(value: unknown) {
  return value === "en" ? "en" : "zh";
}
