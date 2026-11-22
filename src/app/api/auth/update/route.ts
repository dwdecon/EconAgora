import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE, MAX_EMAIL_LENGTH, MAX_PASSWORD_BYTES, hashPassword,
  sessionCookieOptions, signSessionToken, verifyPassword,
} from "@/lib/auth-local";
import { requireCloudBaseUser } from "@/lib/cloudbase-server-auth";
import { serverDb } from "@/lib/rdb-server";
import { rateLimit, readJsonBody } from "@/lib/request-security";

export async function POST(request: NextRequest) {
  const auth = await requireCloudBaseUser(request);
  if ("response" in auth) return auth.response;
  const parsed = await readJsonBody(request);
  if ("response" in parsed) return parsed.response;
  const { body } = parsed;
  const newPassword = typeof body.password === "string" ? body.password : "";
  const newEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";

  if (!newPassword && !newEmail) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }
  if (!currentPassword || Buffer.byteLength(currentPassword, "utf8") > MAX_PASSWORD_BYTES) {
    return NextResponse.json({ error: "Current password is required." }, { status: 400 });
  }
  if (newPassword && (newPassword.length < 6 || Buffer.byteLength(newPassword, "utf8") > MAX_PASSWORD_BYTES)) {
    return NextResponse.json({ error: "Password must contain 6 to 1024 bytes." }, { status: 400 });
  }
  if (newEmail && (newEmail.length > MAX_EMAIL_LENGTH || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail))) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }
  const limited = rateLimit(`account-update:${auth.user.id}`, 10, 15 * 60_000);
  if (limited) return limited;

  try {
    const { data: accounts, error: lookupError } = await serverDb.from("auth_users")
      .select("id,email,password_hash").eq("id", auth.user.id).limit(1);
    if (lookupError) {
      console.error("Account lookup failed.");
      return NextResponse.json({ error: "Update failed." }, { status: 500 });
    }
    const account = (accounts as { id: string; email: string; password_hash: string }[])?.[0];
    if (!account) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    if (!await verifyPassword(currentPassword, account.password_hash)) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 403 });
    }
    if (newEmail) {
      const { data: existing, error } = await serverDb.from("auth_users")
        .select("id").eq("email", newEmail).limit(1);
      if (error) return NextResponse.json({ error: "Update failed." }, { status: 500 });
      if ((existing as { id: string }[])?.some((row) => row.id !== auth.user.id)) {
        return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
      }
    }
    const changes: Record<string, string> = {};
    if (newPassword) changes.password_hash = await hashPassword(newPassword);
    if (newEmail) changes.email = newEmail;
    const { error } = await serverDb.from("auth_users").update(changes).eq("id", auth.user.id);
    if (error) {
      const raw = JSON.stringify(error.raw ?? "");
      if (raw.includes("23505") || raw.includes("duplicate key")) {
        return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
      }
      console.error("Account update failed.");
      return NextResponse.json({ error: "Update failed." }, { status: 500 });
    }
    const user = {
      id: auth.user.id,
      email: newEmail || account.email,
      displayName: auth.user.name || account.email.split("@")[0] || "User",
    };
    const response = NextResponse.json({ success: true, user }, {
      headers: { "Cache-Control": "no-store" },
    });
    response.cookies.set(AUTH_COOKIE, signSessionToken(user), sessionCookieOptions());
    return response;
  } catch {
    console.error("Account update failed.");
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }
}
