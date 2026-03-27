"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { getSessionAccessToken } from "@/lib/cloudbase";

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
  const locale = useLocale();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const accessToken = await getSessionAccessToken();

      if (!accessToken) {
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
      const response = await fetch("/api/prompts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          category,
          tags,
          description,
          content,
          locale,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const errorMessage =
          payload?.error ||
          (response.status === 401
            ? "Please sign in first."
            : "Failed to publish the prompt.");
        if (response.status === 401) {
          router.push("/auth/login");
        }
        console.error("Failed to create prompt:", payload);
        alert(errorMessage);
        return;
      }

      const payload = await response.json();
      router.push(`/prompts/${payload.id}`);
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
        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-primary focus:outline-none"
      />
      <select
        name="category"
        required
        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 text-[var(--color-text-primary)] focus:border-primary focus:outline-none"
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
        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-primary focus:outline-none"
      />
      <textarea
        name="description"
        rows={2}
        placeholder="Short description"
        className="resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-primary focus:outline-none"
      />
      <textarea
        name="content"
        required
        rows={10}
        placeholder="Prompt content"
        className="resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 font-mono text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-primary focus:outline-none"
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
