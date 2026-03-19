"use client";

import { toggleLike } from "@/actions/likes";
import { TargetType } from "@prisma/client";
import { useTransition } from "react";

export default function LikeButton({
  targetType,
  targetId,
  likeCount,
  liked,
}: {
  targetType: TargetType;
  targetId: string;
  likeCount: number;
  liked: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => toggleLike(targetType, targetId))}
      className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition ${
        liked
          ? "border-primary text-primary"
          : "border-dark-border text-gray-text hover:text-white"
      }`}
    >
      {liked ? "♥" : "♡"} {likeCount}
    </button>
  );
}
