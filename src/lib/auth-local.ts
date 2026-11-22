import crypto from "node:crypto";
import jwt from "jsonwebtoken";

/**
 * Local auth primitives (replaces CloudBase auth).
 * - password hashing: node crypto scrypt (no external dependency)
 * - session token: HS256 JWT in an HttpOnly cookie; Bearer scripts remain supported.
 */

export const AUTH_COOKIE = "econagora_jwt";
export const AUTH_MAX_AGE = 7 * 24 * 3600; // 7 days, in seconds
export const MAX_PASSWORD_BYTES = 1024;
export const MAX_EMAIL_LENGTH = 254;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1 };

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET ?? "";
  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }
  return secret;
}

function derivePassword(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, SCRYPT_OPTIONS, (error, hash) => {
      if (error) reject(error);
      else resolve(hash);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  if (Buffer.byteLength(password, "utf8") > MAX_PASSWORD_BYTES) {
    throw new RangeError("Password is too long.");
  }
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = (await derivePassword(password, salt)).toString("hex");
  return `scrypt$16384$8$1$${salt}$${hash}`;
}

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (typeof stored !== "string" || Buffer.byteLength(password, "utf8") > MAX_PASSWORD_BYTES) return false;
  // Accept the existing storage format, without trusting stored work factors.
  const parts = /^scrypt\$16384\$8\$1\$([a-f0-9]{32})\$([a-f0-9]{128})$/i.exec(stored);
  if (!parts) return false;
  const [, salt, hash] = parts;
  const calculated = await derivePassword(password, salt);
  const expected = Buffer.from(hash, "hex");
  if (calculated.length !== expected.length) return false;
  return crypto.timingSafeEqual(calculated, expected);
}

export function generateUserId(): string {
  return crypto.randomUUID();
}

export function signSessionToken(user: SessionUser): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
      role: "authenticated",
    },
    getJwtSecret(),
    { expiresIn: AUTH_MAX_AGE, algorithm: "HS256" },
  );
}

export function verifySessionToken(token: string): SessionUser | null {
  try {
    if (token.length > 8192) return null;
    const payload = jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    });
    if (typeof payload === "string") return null;
    const now = Math.floor(Date.now() / 1000);
    if (
      typeof payload.sub !== "string" || !payload.sub || payload.sub.length > 128 ||
      payload.role !== "authenticated" || payload.svc !== undefined ||
      !Number.isInteger(payload.exp) || !Number.isInteger(payload.iat) ||
      payload.iat! > now + 60 || payload.exp! <= payload.iat! ||
      payload.exp! - payload.iat! > AUTH_MAX_AGE + 60
    ) return null;
    return {
      id: payload.sub,
      email: typeof payload.email === "string" ? payload.email : "",
      displayName:
        typeof payload.displayName === "string" && payload.displayName
          ? payload.displayName
          : payload.email?.split("@")[0] || "User",
    };
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: AUTH_MAX_AGE,
    path: "/",
  };
}
