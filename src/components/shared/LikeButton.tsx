"use client";

import { useState, useTransition } from "react";
import { db, getSessionUser } from "@/lib/cloudbase";
import { createId } from "@/lib/rdb-utils";

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
    const sessionUser = await getSessionUser();
    if (!sessionUser) return;

    const previousLiked = liked;
    const previousCount = likeCount;
    const nextLiked = !previousLiked;
    const nextCount = previousLiked
      ? Math.max(0, previousCount - 1)
      : previousCount + 1;
    const targetTable = targetType === "PROMPT" ? "prompt" : "post";

    setLiked(nextLiked);
    setLikeCount(nextCount);

    const likeMutation = previousLiked
      ? await db
          .from("user_like")
          .delete()
          .eq("user_id", sessionUser.id)
          .eq("target_type", targetType)
          .eq("target_id", targetId)
      : await db.from("user_like").insert({
          _id: createId("like"),
          user_id: sessionUser.id,
          target_type: targetType,
          target_id: targetId,
          created_at: new Date().toISOString(),
        });

    if (likeMutation.error) {
      setLiked(previousLiked);
      setLikeCount(previousCount);
      return;
    }

    const counterMutation = await db
      .from(targetTable)
      .update({
        like_count: nextCount,
        updated_at: new Date().toISOString(),
      })
      .eq("_id", targetId);

    if (!counterMutation.error) {
      return;
    }

    setLiked(previousLiked);
    setLikeCount(previousCount);

    if (previousLiked) {
      await db.from("user_like").insert({
        _id: createId("like"),
        user_id: sessionUser.id,
        target_type: targetType,
        target_id: targetId,
        created_at: new Date().toISOString(),
      });
      return;
    }

    await db
      .from("user_like")
      .delete()
      .eq("user_id", sessionUser.id)
      .eq("target_type", targetType)
      .eq("target_id", targetId);
  }

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(handleToggle)}
      className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition ${
        liked
          ? "border-primary text-primary"
          : "border-dark-border text-gray-text hover:text-white"
      }`}
    >
      {liked ? "Liked" : "Like"} {likeCount}
    </button>
  );
}
