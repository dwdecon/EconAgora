import { NextResponse } from "next/server";
import { AUTH_COOKIE, verifySessionToken } from "@/lib/auth-local";
import { validateMutationOrigin } from "@/lib/request-security";

export interface CloudBaseServerUser {
  id: string;
  email: string | null;
  name: string | null;
  picture: string | null;
  raw: unknown;
}

export function getBearerToken(request: Request) {
  const header = request.headers.get("authorization")?.trim();
  if (!header) return null;

  const match = /^Bearer\s+([^\s,]+)$/i.exec(header);
  return match && match[1].length <= 8192 ? match[1] : null;
}

export function getSessionToken(request: Request): string | null {
  const cookie = request.headers.get("cookie")?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${AUTH_COOKIE}=`));
  if (cookie) {
    try {
      const token = decodeURIComponent(cookie.slice(AUTH_COOKIE.length + 1));
      if (token) return token.length <= 8192 ? token : null;
    } catch {
      return null;
    }
  }
  return getBearerToken(request);
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function serverError(message = "Internal server error") {
  return NextResponse.json({ error: message }, { status: 500 });
}

/**
 * Validates a session JWT locally (issued by /api/auth/login|register).
 * Kept the historical name/signature so API routes need no changes.
 */
export async function getCloudBaseCurrentUser(accessToken: string) {
  const user = verifySessionToken(accessToken);
  if (!user) {
    return {
      error: "Invalid or expired session token.",
      user: null,
    };
  }

  return {
    error: null,
    user: {
      id: user.id,
      email: user.email || null,
      name: user.displayName || null,
      picture: null,
      raw: { sub: user.id, email: user.email, displayName: user.displayName },
    } as CloudBaseServerUser,
  };
}

export async function requireCloudBaseUser(request: Request): Promise<
  { response: NextResponse } | { accessToken: string; user: CloudBaseServerUser }
> {
  const originError = validateMutationOrigin(request);
  if (originError) return { response: originError };
  const accessToken = getSessionToken(request);
  if (!accessToken) {
    return { response: unauthorized("Missing access token.") };
  }

  try {
    const { error, user } = await getCloudBaseCurrentUser(accessToken);
    if (error || !user) {
      return { response: unauthorized(error ?? "Unauthorized.") };
    }

    return { accessToken, user };
  } catch (error) {
    console.error("Failed to validate access token:", error);
    return { response: serverError("Failed to validate session.") };
  }
}

export function getUserDisplayName(user: Pick<CloudBaseServerUser, "email" | "name">) {
  return (
    user.name?.trim() ||
    user.email?.split("@")[0] ||
    "User"
  );
}
