"use client";

import { useState, useTransition } from "react";
import { getSessionAccessToken } from "@/lib/cloudbase";
import { Heart } from "lucide-react";

type TargetType = "PROMPT" | "POST" | "SKILL";
type ExtendedTargetType = TargetType | "TOOL";

export default function LikeButton({
  targetType,
  targetId,
  likeCount: initialCount,
  liked: initialLiked,
  variant = "like",
}: {
  targetType: ExtendedTargetType;
  targetId: string;
  likeCount: number;
  liked: boolean;
  variant?: "like" | "star";
}) {
  const [isPending, startTransition] = useTransition();
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);

  async function handleToggle() {
    const accessToken = await getSessionAccessToken();
    if (!accessToken) {
      const callbackUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/auth/login?callbackUrl=${callbackUrl}`;
      return;
    }

    const previousLiked = liked;
    const previousCount = likeCount;
    const nextLiked = !previousLiked;
    const nextCount = previousLiked
      ? Math.max(0, previousCount - 1)
      : previousCount + 1;

    setLiked(nextLiked);
    setLikeCount(nextCount);

    const response = await fetch("/api/likes/toggle", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ targetType, targetId }),
    });

    if (!response.ok) {
      setLiked(previousLiked);
      setLikeCount(previousCount);
      console.error("Failed to toggle like:", await response.json().catch(() => null));
      return;
    }

    const payload = await response.json();
    setLiked(Boolean(payload.liked));
    setLikeCount(Number(payload.likeCount ?? nextCount));
  }

  if (variant === "star") {
    return (
      <button
        disabled={isPending}
        onClick={() => startTransition(handleToggle)}
        className={`flex items-center gap-2 text-sm text-[var(--color-text-secondary)] transition ${
          liked ? "text-red-500" : "hover:text-[var(--color-text-primary)]"
        }`}
      >
        <Heart className={`h-4 w-4 ${liked ? "fill-red-500 text-red-500" : "text-red-500"}`} />
        <span>点赞</span>
        <span className="ml-auto font-medium text-[var(--color-text-primary)]">
          {likeCount}
        </span>
      </button>
    );
  }

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(handleToggle)}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[14px] transition-colors shadow-[var(--shadow-inset-button)] ${
        liked
          ? "border-[var(--color-text-primary)] bg-[var(--color-text-primary)] text-[var(--color-bg)] hover:opacity-80"
          : "border-[var(--color-border-hover)] bg-[var(--color-bg-surface-strong)] text-[var(--color-text-primary)] hover:bg-[var(--color-text-primary)] hover:text-[var(--color-bg)]"
      }`}
    >
      <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
      {liked ? "Liked" : "Like"} {likeCount}
    </button>
  );
}
