"use client";

import { useState, useTransition } from "react";
import { getSessionAccessToken } from "@/lib/cloudbase";

type TargetType = "PROMPT" | "POST";

export default function LikeButton({
  targetType,
  targetId,
  likeCount: initialCount,
  liked: initialLiked,
}: {
  targetType: TargetType;
  targetId: string;
  likeCount: number;
  liked: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);

  async function handleToggle() {
    const accessToken = await getSessionAccessToken();
    if (!accessToken) return;

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

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(handleToggle)}
      className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition ${
        liked
          ? "border-primary text-primary"
          : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
      }`}
    >
      {liked ? "Liked" : "Like"} {likeCount}
    </button>
  );
}
