"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/cloudbase";

interface AuthUser {
  id: string;
  email?: string;
  displayName: string;
  phoneNumber?: string;
}

function mapUser(user: any): AuthUser {
  return {
    id: user.id,
    email: user.email,
    displayName:
      user.user_metadata?.nickname ||
      user.user_metadata?.nickName ||
      user.email?.split("@")[0] ||
      "User",
    phoneNumber: user.phone,
  };
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const syncUser = (nextUser: any) => {
      if (!mounted) return;
      setUser(nextUser ? mapUser(nextUser) : null);
      setLoading(false);
    };

    auth
      ?.getUser?.()
      .then(({ data }: any) => syncUser(data?.user ?? null))
      .catch(() => syncUser(null));

    const subscription = auth
      ?.onAuthStateChange?.((_event: string, session: any) => {
        syncUser(session?.user ?? null);
      })
      ?.data?.subscription;

    return () => {
      mounted = false;
      subscription?.unsubscribe?.();
    };
  }, []);

  async function signIn(email: string, password: string) {
    return auth.signInWithPassword({ email, password });
  }

  async function signUp(email: string, password: string) {
    return auth.signUpWithEmailAndPassword(email, password);
  }

  async function signOut() {
    return auth.signOut();
  }

  return { user, loading, signIn, signUp, signOut };
}
