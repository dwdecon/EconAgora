import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, sessionCookieOptions } from "@/lib/auth-local";
import { validateMutationOrigin } from "@/lib/request-security";

export async function POST(request: NextRequest) {
  const originError = validateMutationOrigin(request);
  if (originError) return originError;
  const response = NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(AUTH_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}
