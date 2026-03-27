"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { getSessionAccessToken } from "@/lib/cloudbase";

export default function PostForm() {
  const router = useRouter();
  const locale = useLocale();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const title = String(formData.get("title") || "").trim();
      const content = String(formData.get("content") || "").trim();
      const tagsInput = String(formData.get("tags") || "").trim();
      const tags = tagsInput
        ? tagsInput
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [];
      const accessToken = await getSessionAccessToken();
      if (!accessToken) {
        alert("Please sign in first.");
        router.push("/auth/login");
        return;
      }

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          tags,
          locale,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const errorMessage =
          payload?.error ||
          (response.status === 401
            ? "Please sign in first."
            : "Failed to create the post.");
        if (response.status === 401) {
          router.push("/auth/login");
        }
        console.error("Failed to create post:", payload);
        alert(errorMessage);
        return;
      }

      const payload = await response.json();
      router.push(`/community/${payload.id}`);
    } catch (error) {
      console.error("Failed to create post:", error);
      alert("Failed to create the post.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-4">
      <input
        name="title"
        required
        placeholder="Post title"
        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-primary focus:outline-none"
      />
      <textarea
        name="content"
        required
        rows={8}
        placeholder="Share your thoughts..."
        className="resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-primary focus:outline-none"
      />
      <input
        name="tags"
        placeholder="Tags separated by commas"
        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-primary focus:outline-none"
      />
      <button
        type="submit"
        disabled={submitting}
        className="self-start rounded-lg bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50"
      >
        {submitting ? "Publishing..." : "Publish"}
      </button>
    </form>
  );
}
