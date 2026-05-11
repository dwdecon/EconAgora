"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import PageShell from "@/components/layout/PageShell";
import AccountForm from "@/components/account/AccountForm";
import SecuritySection from "@/components/account/SecuritySection";
import MyContentSection from "@/components/account/MyContentSection";
import LikesAndHistorySection from "@/components/account/LikesAndHistorySection";
import { auth, getSessionAccessToken } from "@/lib/cloudbase";

interface Profile {
  name: string;
  avatar: string | null;
  affiliation: string;
  bio: string;
  locale: string;
  email: string | null;
}

const i18n = {
  zh: {
    title: "账户设置",
    loading: "加载中...",
  },
  en: {
    title: "Account Settings",
    loading: "Loading...",
  },
};

type Tab = "profile" | "security" | "content";

export default function AccountPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = i18n[locale === "en" ? "en" : "zh"];
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        // Timeout after 10s
        const timeout = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 10000)
        );

        const accessToken = await Promise.race([
          getSessionAccessToken(),
          timeout,
        ]).catch(() => null);

        if (cancelled) return;

        if (!accessToken) {
          router.replace("/auth/login");
          return;
        }

        const { data: userData } = await auth.getUser();
        const user = userData?.user;
        if (!user) {
          router.replace("/auth/login");
          return;
        }

        if (cancelled) return;
        setUserId(user.id);

        const res = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (cancelled) return;

        if (res.ok) {
          const { profile: p } = await res.json();
          setProfile({
            ...p,
            name: p.name || user.user_metadata?.nickname || user.email?.split("@")[0] || "User",
          });
        } else {
          setProfile({
            name: user.user_metadata?.nickname || user.email?.split("@")[0] || "User",
            avatar: null,
            affiliation: "",
            bio: "",
            locale: locale,
            email: user.email,
          });
        }
      } catch (e) {
        console.error("Account page load error:", e);
        if (!cancelled) {
          router.replace("/auth/login");
          return;
        }
      }

      if (!cancelled) {
        setLoading(false);
      }
    }

    loadUser();
    return () => { cancelled = true; };
  }, [router, locale]);

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-text-primary)] border-t-transparent" />
        </div>
      </PageShell>
    );
  }

  const tabs: { id: Tab; label: string }[] = locale === "en"
    ? [
        { id: "profile", label: "Profile" },
        { id: "security", label: "Security" },
        { id: "content", label: "My Content" },
      ]
    : [
        { id: "profile", label: "基本信息" },
        { id: "security", label: "账号安全" },
        { id: "content", label: "我的内容" },
      ];

  return (
    <PageShell width="3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-[var(--color-text-primary)]">{t.title}</h1>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
              activeTab === tab.id
                ? "bg-[var(--color-bg-card)] text-[var(--color-text-primary)] shadow-sm"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "profile" && profile && (
        <AccountForm profile={profile} email={profile.email} />
      )}
      {activeTab === "security" && profile && (
        <SecuritySection email={profile.email} />
      )}
      {activeTab === "content" && userId && (
        <div className="flex flex-col gap-8">
          <MyContentSection userId={userId} />
          <LikesAndHistorySection userId={userId} />
        </div>
      )}
    </PageShell>
  );
}
