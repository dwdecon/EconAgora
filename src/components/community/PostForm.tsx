"use client";

import { createPost } from "@/actions/community";

export default function PostForm() {
  return (
    <form action={createPost} className="flex flex-col gap-4 max-w-2xl">
      <input
        name="title"
        required
        placeholder="帖子标题"
        className="rounded-lg bg-dark-card border border-dark-border px-4 py-3 text-white placeholder:text-gray-text focus:border-primary focus:outline-none"
      />
      <textarea
        name="content"
        required
        rows={8}
        placeholder="写下你的想法..."
        className="rounded-lg bg-dark-card border border-dark-border px-4 py-3 text-white placeholder:text-gray-text focus:border-primary focus:outline-none resize-none"
      />
      <input
        name="tags"
        placeholder="标签（逗号分隔）"
        className="rounded-lg bg-dark-card border border-dark-border px-4 py-3 text-white placeholder:text-gray-text focus:border-primary focus:outline-none"
      />
      <button
        type="submit"
        className="self-start rounded-lg bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-hover transition"
      >
        发布
      </button>
    </form>
  );
}
