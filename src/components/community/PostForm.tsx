"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db, getSessionUser } from "@/lib/cloudbase";
import { createId } from "@/lib/rdb-utils";

export default function PostForm() {
  const router = useRouter();
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

      const sessionUser = await getSessionUser();
      if (!sessionUser) {
        alert("Please sign in first.");
        router.push("/auth/login");
        return;
      }

      const postId = createId("post");
      const now = new Date().toISOString();
      const { error } = await db.from("post").insert({
        _id: postId,
        title,
        content,
        tags,
        locale: "zh",
        pinned: false,
        is_agent_post: false,
        like_count: 0,
        author_id: sessionUser.id,
        created_at: now,
        updated_at: now,
      });

      if (error) {
        console.error("Failed to create post:", error);
        alert("Failed to create the post.");
        return;
      }

      router.push(`/community/${postId}`);
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
        className="rounded-lg border border-dark-border bg-dark-card px-4 py-3 text-white placeholder:text-gray-text focus:border-primary focus:outline-none"
      />
      <textarea
        name="content"
        required
        rows={8}
        placeholder="Share your thoughts..."
        className="resize-none rounded-lg border border-dark-border bg-dark-card px-4 py-3 text-white placeholder:text-gray-text focus:border-primary focus:outline-none"
      />
      <input
        name="tags"
        placeholder="Tags separated by commas"
        className="rounded-lg border border-dark-border bg-dark-card px-4 py-3 text-white placeholder:text-gray-text focus:border-primary focus:outline-none"
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
