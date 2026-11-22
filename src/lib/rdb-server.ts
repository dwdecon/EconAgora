import jwt from "jsonwebtoken";
import { RdbQueryBuilder } from "@/lib/rdb";

/**
 * Server-side RDB access: talks to the self-hosted PostgREST directly
 * (127.0.0.1:3100) with a service JWT.
 *
 * The service token carries svc="server" which the RLS write policies accept
 * as a trusted-server bypass — server routes have already authenticated and
 * validated the acting user themselves (mirrors the old CloudBase accessKey
 * admin mode). Client-facing writes still go through strict RLS.
 */

function getServerRdbConfig() {
  const secret = process.env.JWT_SECRET ?? "";

  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return {
    secret,
    baseUrl: process.env.RDB_BASE_URL || "http://127.0.0.1:3100",
  };
}

let cachedServiceToken: { token: string; exp: number } | null = null;

function getServiceToken(): string {
  const { secret } = getServerRdbConfig();
  const now = Math.floor(Date.now() / 1000);

  if (cachedServiceToken && cachedServiceToken.exp - 60 > now) {
    return cachedServiceToken.token;
  }

  const token = jwt.sign(
    { role: "authenticated", sub: "server", svc: "server" },
    secret,
    { expiresIn: "1h", algorithm: "HS256" },
  );
  const payload = jwt.decode(token) as any;
  cachedServiceToken = { token, exp: Number(payload?.exp) || now + 3600 };
  return token;
}

export const serverDb = {
  from<TData = any>(table: string) {
    const { baseUrl } = getServerRdbConfig();
    return new RdbQueryBuilder<TData>(table, baseUrl, getServiceToken);
  },
};
