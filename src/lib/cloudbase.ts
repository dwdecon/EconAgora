"use client";

import cloudbase from "@cloudbase/js-sdk";
import "@cloudbase/auth";
import { RdbQueryBuilder } from "@/lib/rdb";

cloudbase.registerVersion("2.26.3");

const envId = process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID ?? "";
const accessKey = process.env.NEXT_PUBLIC_CLOUDBASE_ACCESS_KEY ?? "";
const region = process.env.NEXT_PUBLIC_CLOUDBASE_REGION ?? "ap-shanghai";
const isBrowser = typeof window !== "undefined";

const app =
  isBrowser && envId
    ? cloudbase.init({
        env: envId,
        region,
        ...(accessKey ? { accessKey } : {}),
        auth: { detectSessionInUrl: true },
      } as any)
    : null;

const baseUrl = envId
  ? `https://${envId}.api.tcloudbasegateway.com/v1/rdb/rest`
  : "";

export const auth: any = app ? app.auth() : null;

export const db = {
  from<TData = any>(table: string) {
    return new RdbQueryBuilder<TData>(table, baseUrl, getAuthorizationToken);
  },
};

export async function getSession() {
  if (!auth?.getSession) {
    return null;
  }

  try {
    const result = await auth.getSession();
    return result?.data?.session ?? null;
  } catch {
    return null;
  }
}

export async function getSessionAccessToken() {
  const session = await getSession();
  return session?.access_token || session?.accessToken || "";
}

export async function getSessionUser() {
  const session = await getSession();
  return session?.user ?? null;
}

export function useCloudBaseReady() {
  return Boolean(app);
}

async function getAuthorizationToken() {
  return (await getSessionAccessToken()) || accessKey;
}
