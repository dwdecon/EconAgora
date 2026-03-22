"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
      <div className="mx-auto max-w-3xl px-6 py-12">
        <p className="py-20 text-center text-gray-text">Loading...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-bold">Publish Prompt</h1>
      <PromptForm />
    </div>
  );
}
