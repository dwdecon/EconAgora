"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db, getSessionUser } from "@/lib/cloudbase";
import { createId } from "@/lib/rdb-utils";

const categories = [
  "Literature Review",
  "Data Analysis",
  "Paper Writing",
  "Peer Review",
  "Topic Selection",
  "Other",
];

export default function PromptForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const sessionUser = await getSessionUser();

      if (!sessionUser) {
        alert("Please sign in first.");
        router.push("/auth/login");
        return;
      }

      const title = String(formData.get("title") || "").trim();
      const category = String(formData.get("category") || "").trim();
      const tagsInput = String(formData.get("tags") || "").trim();
      const description = String(formData.get("description") || "").trim();
      const content = String(formData.get("content") || "").trim();
      const tags = tagsInput
        ? tagsInput
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [];
      const promptId = createId("prompt");
      const now = new Date().toISOString();

      const { error } = await db.from("prompt").insert({
        _id: promptId,
        title,
        category,
        tags,
        description: description || null,
        content,
        locale: "zh",
        status: "PUBLISHED",
        author_id: sessionUser.id,
        like_count: 0,
        download_count: 0,
        created_at: now,
        updated_at: now,
      });

      if (error) {
        console.error("Failed to create prompt:", error);
        alert("Failed to publish the prompt.");
        return;
      }

      router.push(`/prompts/${promptId}`);
    } catch (error) {
      console.error("Failed to create prompt:", error);
      alert("Failed to publish the prompt.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-4">
      <input
        name="title"
        required
        placeholder="Title"
        className="rounded-lg border border-dark-border bg-dark-card px-4 py-3 text-white placeholder:text-gray-text focus:border-primary focus:outline-none"
      />
      <select
        name="category"
        required
        className="rounded-lg border border-dark-border bg-dark-card px-4 py-3 text-white focus:border-primary focus:outline-none"
      >
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
      <input
        name="tags"
        placeholder="Tags separated by commas"
        className="rounded-lg border border-dark-border bg-dark-card px-4 py-3 text-white placeholder:text-gray-text focus:border-primary focus:outline-none"
      />
      <textarea
        name="description"
        rows={2}
        placeholder="Short description"
        className="resize-none rounded-lg border border-dark-border bg-dark-card px-4 py-3 text-white placeholder:text-gray-text focus:border-primary focus:outline-none"
      />
      <textarea
        name="content"
        required
        rows={10}
        placeholder="Prompt content"
        className="resize-none rounded-lg border border-dark-border bg-dark-card px-4 py-3 font-mono text-sm text-white placeholder:text-gray-text focus:border-primary focus:outline-none"
      />
      <button
        type="submit"
        disabled={submitting}
        className="self-start rounded-lg bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Publishing..." : "Publish"}
      </button>
    </form>
  );
}
