"use client";

import { auth, db } from "./cloudbase";

export async function getCurrentUser() {
  try {
    const { data: userData, error: authError } = await auth.getUser();
    if (authError || !userData?.user) return null;

    const uid = userData.user.id;

    const { data: profile } = await db
      .from("user_profile")
      .select("*")
      .eq("cloudbase_uid", uid)
      .single();

    return {
      id: uid,
      email: userData.user.email,
      name:
        (profile as any)?.name ||
        userData.user.user_metadata?.nickname ||
        userData.user.user_metadata?.nickName ||
        userData.user.email?.split("@")[0] ||
        "User",
      avatar: (profile as any)?.avatar || null,
      role: (profile as any)?.role || "USER",
      profile,
    };
  } catch {
    return null;
  }
}
