"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import PageShell from "@/components/layout/PageShell";
import { getSessionUser } from "@/lib/cloudbase";
import PromptForm from "@/components/prompts/PromptForm";

export default function NewPromptPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      const sessionUser = await getSessionUser();
      if (!mounted) return;

      if (!sessionUser) {
        router.replace("/auth/login");
        setLoading(false);
        return;
      }

      setIsLoggedIn(true);
      setLoading(false);
    }

    checkAuth();
    return () => {
      mounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <PageShell width="3xl">
        <p className="py-20 text-center text-[var(--color-text-secondary)]">Loading...</p>
      </PageShell>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <PageShell width="3xl">
      <h1 className="mb-8 text-3xl font-bold">Publish Prompt</h1>
      <PromptForm />
    </PageShell>
  );
}
