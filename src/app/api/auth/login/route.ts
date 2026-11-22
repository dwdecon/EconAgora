import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE,
  MAX_EMAIL_LENGTH,
  MAX_PASSWORD_BYTES,
  sessionCookieOptions,
  signSessionToken,
  verifyPassword,
} from "@/lib/auth-local";
import { serverDb } from "@/lib/rdb-server";
import { getClientAddress, rateLimit, readJsonBody, validateMutationOrigin } from "@/lib/request-security";

const DUMMY_PASSWORD_HASH = `scrypt$16384$8$1$${"0".repeat(32)}$${"0".repeat(128)}`;

export async function POST(request: NextRequest) {
  const originError = validateMutationOrigin(request);
  if (originError) return originError;
  const parsed = await readJsonBody(request);
  if ("response" in parsed) return parsed.response;
  try {
    const { body } = parsed;
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || email.length > MAX_EMAIL_LENGTH || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        !password || Buffer.byteLength(password, "utf8") > MAX_PASSWORD_BYTES) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }
    const limited = rateLimit(`login:ip:${getClientAddress(request)}`, 30, 15 * 60_000) ??
      rateLimit(`login:account:${email}`, 10, 15 * 60_000);
    if (limited) return limited;

    const { data: users, error } = await serverDb
      .from("auth_users")
      .select("id, email, password_hash")
      .eq("email", email)
      .limit(1);

    if (error) {
      console.error("Login lookup failed.");
      return NextResponse.json({ error: "Login failed." }, { status: 500 });
    }

    const account = (users as any[])?.[0];
    const passwordValid = await verifyPassword(password, account?.password_hash ?? DUMMY_PASSWORD_HASH);
    if (!account || !passwordValid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // display name lives in user_profile
    const { data: profiles } = await serverDb
      .from("user_profile")
      .select("name")
      .eq("cloudbase_uid", account.id)
      .limit(1);

    const displayName = (profiles as any[])?.[0]?.name || account.email.split("@")[0] || "User";

    const token = signSessionToken({
      id: account.id,
      email: account.email,
      displayName,
    });

    const response = NextResponse.json({
      user: { id: account.id, email: account.email, displayName },
    }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(AUTH_COOKIE, token, sessionCookieOptions());
    return response;
  } catch {
    console.error("Login failed.");
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
