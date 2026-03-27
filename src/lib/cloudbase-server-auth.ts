import { NextResponse } from "next/server";

export interface CloudBaseServerUser {
  id: string;
  email: string | null;
  name: string | null;
  picture: string | null;
  raw: unknown;
}

function getAuthApiUrl() {
  const envId = process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID ?? "";

  if (!envId) {
    throw new Error("NEXT_PUBLIC_CLOUDBASE_ENV_ID is not configured.");
  }

  const url = new URL(`https://${envId}.api.tcloudbasegateway.com/auth/v1/user/me`);
  url.searchParams.set("client_id", envId);
  return url;
}

export function getBearerToken(request: Request) {
  const header = request.headers.get("authorization")?.trim();
  if (!header) return null;

  const [scheme, token] = header.split(/\s+/, 2);
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
    return null;
  }

  return token;
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

export async function getCloudBaseCurrentUser(accessToken: string) {
  const response = await fetch(getAuthApiUrl(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const text = await response.text();
  let payload: any = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    return {
      error:
        payload?.error_description ||
        payload?.error ||
        "Invalid or expired CloudBase session.",
      user: null,
    };
  }

  const user = normalizeCloudBaseUser(payload);
  if (!user) {
    return {
      error: "Unable to resolve the current CloudBase user.",
      user: null,
    };
  }

  return { error: null, user };
}

export async function requireCloudBaseUser(request: Request) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return { response: unauthorized("Missing CloudBase access token.") };
  }

  try {
    const { error, user } = await getCloudBaseCurrentUser(accessToken);
    if (error || !user) {
      return { response: unauthorized(error ?? "Unauthorized.") };
    }

    return { accessToken, user };
  } catch (error) {
    console.error("Failed to validate CloudBase access token:", error);
    return { response: serverError("Failed to validate CloudBase session.") };
  }
}

export function getUserDisplayName(user: Pick<CloudBaseServerUser, "email" | "name">) {
  return (
    user.name?.trim() ||
    user.email?.split("@")[0] ||
    "User"
  );
}

function normalizeCloudBaseUser(payload: any): CloudBaseServerUser | null {
  const profile = payload?.user ?? payload?.data?.user ?? payload;
  const id =
    profile?.sub ||
    profile?.user_id ||
    profile?.id ||
    null;

  if (typeof id !== "string" || !id) {
    return null;
  }

  return {
    id,
    email: typeof profile?.email === "string" ? profile.email : null,
    name:
      typeof profile?.name === "string"
        ? profile.name
        : typeof profile?.username === "string"
          ? profile.username
          : null,
    picture: typeof profile?.picture === "string" ? profile.picture : null,
    raw: payload,
  };
}
