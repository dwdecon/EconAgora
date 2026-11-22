import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE,
  MAX_EMAIL_LENGTH,
  MAX_PASSWORD_BYTES,
  generateUserId,
  hashPassword,
  sessionCookieOptions,
  signSessionToken,
} from "@/lib/auth-local";
import { serverDb } from "@/lib/rdb-server";
import { getClientAddress, rateLimit, readJsonBody, validateMutationOrigin } from "@/lib/request-security";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const originError = validateMutationOrigin(request);
  if (originError) return originError;
  const parsed = await readJsonBody(request);
  if ("response" in parsed) return parsed.response;
  try {
    const { body } = parsed;
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const nickname =
      typeof body?.nickname === "string" && body.nickname.trim()
        ? body.nickname.trim()
        : email.split("@")[0] || "User";

    if (email.length > MAX_EMAIL_LENGTH || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }
    if (password.length < 6 || Buffer.byteLength(password, "utf8") > MAX_PASSWORD_BYTES) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 },
      );
    }
    if (nickname.length > 100) {
      return NextResponse.json({ error: "Display name is too long." }, { status: 400 });
    }
    const limited = rateLimit(`register:ip:${getClientAddress(request)}`, 5, 60 * 60_000);
    if (limited) return limited;

    const { data: existing, error: lookupError } = await serverDb
      .from("auth_users")
      .select("id")
      .eq("email", email)
      .limit(1);
    if (lookupError) {
      console.error("Registration lookup failed.");
      return NextResponse.json({ error: "Registration failed." }, { status: 500 });
    }

    if ((existing as any[])?.length) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    const uid = generateUserId();
    const { error: insertError } = await serverDb.from("auth_users").insert({
      id: uid,
      email,
      password_hash: await hashPassword(password),
    });

    if (insertError) {
      // unique race fallback
      const raw = JSON.stringify(insertError.raw ?? "");
      if (raw.includes("23505") || raw.includes("duplicate key")) {
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 409 },
        );
      }
      console.error("Registration insert failed.");
      return NextResponse.json({ error: "Registration failed." }, { status: 500 });
    }

    const token = signSessionToken({ id: uid, email, displayName: nickname });

    const response = NextResponse.json({
      user: { id: uid, email, displayName: nickname },
    }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(AUTH_COOKIE, token, sessionCookieOptions());
    return response;
  } catch {
    console.error("Registration failed.");
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}
