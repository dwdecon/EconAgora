"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import PostForm from "@/components/community/PostForm";

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
      <div className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-center text-gray-text py-20">加载中...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">发帖</h1>
      <PostForm />
    </div>
  );
}
