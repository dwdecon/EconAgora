"use client";

import { RdbQueryBuilder } from "@/lib/rdb";

/**
 * Self-hosted replacement for the CloudBase browser SDK.
 * - db: allowlisted read-only application proxy at /api/rdb (same origin)
 * - auth: thin compatibility layer over /api/auth/* that keeps the
 *   CloudBase-shaped API (signInWithPassword / signUp / signOut / getUser /
 *   updateUser / onAuthStateChange / getSession*) used across the app.
 * - session JWT stays in an HttpOnly cookie and is never exposed to scripts.
 */

const AUTH_EVENT = "econagora-auth-change";
const isBrowser = typeof window !== "undefined";

const baseUrl = "/api/rdb";

export interface ClientAuthUser {
  id: string;
  email?: string;
  displayName: string;
  phoneNumber?: string;
}

function normalizeUser(raw: any): ClientAuthUser | null {
  if (!raw || typeof raw.id !== "string" || !raw.id) return null;
  return {
    id: raw.id,
    email: typeof raw.email === "string" ? raw.email : undefined,
    displayName:
      raw.displayName ||
      raw.user_metadata?.nickname ||
      raw.user_metadata?.nickName ||
      raw.email?.split("@")[0] ||
      "User",
    phoneNumber: raw.phone,
  };
}

type AuthListener = (event: string, session: any) => void;

function emitAuthState(user: any) {
  authGeneration += 1;
  latestAuthUser = normalizeUser(user);
  userRequest = null;
  if (!isBrowser) return;
  window.dispatchEvent(
    new CustomEvent(AUTH_EVENT, {
      detail: { event: user ? "SIGNED_IN" : "SIGNED_OUT", user: user ?? null },
    }),
  );
}

async function parseResponse(res: Response) {
  const payload = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, payload };
}

type SessionState = { user: ClientAuthUser | null; error: { message: string } | null };
let userRequest: Promise<SessionState> | null = null;
let authGeneration = 0;
let latestAuthUser: ClientAuthUser | null = null;

async function fetchSessionState(): Promise<SessionState> {
  if (!isBrowser) return { user: null, error: null };
  if (!userRequest) {
    const generation = authGeneration;
    const pending = Promise.resolve().then(async (): Promise<SessionState> => {
      try {
        const { ok, payload } = await parseResponse(await fetch("/api/auth/me", {
          cache: "no-store", credentials: "same-origin", signal: AbortSignal.timeout(8_000),
        }));
        if (generation !== authGeneration) return { user: latestAuthUser, error: null };
        const user = ok ? normalizeUser(payload?.user) : null;
        latestAuthUser = user;
        return { user, error: null };
      } catch {
        return generation !== authGeneration
          ? { user: latestAuthUser, error: null }
          : { user: null, error: { message: "Unable to check your session. Please try again." } };
      }
    });
    userRequest = pending;
    void pending.finally(() => { if (userRequest === pending) userRequest = null; });
  }
  return userRequest;
}

const authImpl: any = {
  async signInWithPassword({ email, password }: { email: string; password: string }) {
    const { ok, payload } = await parseResponse(
      await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }),
    );
    if (!ok) {
      return { data: null, error: { message: payload?.error || "Login failed." } };
    }
    const user = normalizeUser(payload?.user);
    emitAuthState(user);
    return { data: { user }, error: null };
  },

  async signUp({
    email,
    password,
    nickname,
  }: { email: string; password: string; nickname?: string }) {
    const { ok, payload } = await parseResponse(
      await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, nickname }),
      }),
    );
    if (!ok) {
      return { data: null, error: { message: payload?.error || "Registration failed." } };
    }
    const user = normalizeUser(payload?.user);
    emitAuthState(user);
    return { data: { user }, error: null };
  },

  async signOut() {
    try {
      const { ok, payload } = await parseResponse(await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }));
      if (!ok) return { error: { message: payload?.error || "Sign out failed." } };
    } catch {
      return { error: { message: "Sign out failed." } };
    }
    emitAuthState(null);
    return { error: null };
  },

  async getUser() {
    const session = await fetchSessionState();
    return { data: { user: session.user }, error: session.error };
  },

  async updateUser(update: { password?: string; email?: string; currentPassword?: string }) {
    const { ok, payload } = await parseResponse(
      await fetch("/api/auth/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      }),
    );
    if (!ok) {
      return { data: null, error: { message: payload?.error || "Update failed." } };
    }
    const user = normalizeUser(payload?.user);
    if (update.email) {
      emitAuthState(user);
    }
    return { data: payload ?? { success: true }, error: null };
  },

  onAuthStateChange(cb: AuthListener) {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail ?? {};
      cb(detail.event ?? "INITIAL_SESSION", { user: detail.user ?? null });
    };
    window.addEventListener(AUTH_EVENT, handler);
    return {
      data: {
        subscription: {
          unsubscribe: () => window.removeEventListener(AUTH_EVENT, handler),
        },
      },
    };
  },
};

export const auth: any = isBrowser ? authImpl : null;

export const db = {
  from<TData = any>(table: string) {
    return new RdbQueryBuilder<TData>(table, baseUrl, "");
  },
};

export async function getSession() {
  const { user } = await fetchSessionState();
  return user ? { user: { id: user.id, email: user.email } } : null;
}

export async function getSessionUser() {
  return (await fetchSessionState()).user;
}

export function useCloudBaseReady() {
  return true;
}

