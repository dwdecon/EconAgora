"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import PostForm from "@/components/community/PostForm";
import PageShell from "@/components/layout/PageShell";
import { getCurrentUser } from "@/lib/auth-helpers";

export default function NewPostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const user = await getCurrentUser();
      if (!user) {
        router.replace("/auth/login");
      } else {
        setIsAuthenticated(true);
      }
      setLoading(false);
    }

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <PageShell width="3xl">
        <p className="py-20 text-center text-[var(--color-text-secondary)]">加载中...</p>
      </PageShell>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <PageShell width="3xl">
      <h1 className="mb-8 text-3xl font-bold">发帖</h1>
      <PostForm />
    </PageShell>
  );
}
