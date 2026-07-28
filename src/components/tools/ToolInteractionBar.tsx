"use client";

import { useEffect, useRef, useState } from "react";
import { Eye } from "lucide-react";
import { db, getSessionUser } from "@/lib/cloudbase";
import LikeButton from "@/components/shared/LikeButton";

const i18n = {
  zh: {
    views: "浏览",
  },
  en: {
    views: "Views",
  },
} as const;

export default function ToolInteractionBar({
  toolId,
  initialLikeCount,
  initialViewCount,
  locale,
}: {
  toolId: string;
  initialLikeCount: number;
  initialViewCount: number;
  locale: string;
}) {
  const t = i18n[locale as keyof typeof i18n] || i18n.zh;
  const [liked, setLiked] = useState(false);
  const [likeCount] = useState(initialLikeCount);
  const [viewCount, setViewCount] = useState(initialViewCount);
  const viewTracked = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function loadLikeState() {
      const sessionUser = await getSessionUser();
      if (!sessionUser || cancelled) return;

      const { data } = await db
        .from("user_like")
        .select("_id")
        .eq("user_id", sessionUser.id)
        .eq("target_type", "TOOL")
        .eq("target_id", toolId)
        .single();

      if (!cancelled) {
        setLiked(Boolean(data));
      }
    }

    loadLikeState();
    return () => {
      cancelled = true;
    };
  }, [toolId]);

  useEffect(() => {
    if (viewTracked.current) return;
    viewTracked.current = true;

    fetch("/api/tools/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolId }),
    })
      .then((response) => {
        if (!response.ok) return;
        setViewCount((current) => current + 1);
      })
      .catch(() => {});
  }, [toolId]);

  return (
    <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-[var(--color-text-secondary)]">
      <span className="inline-flex items-center gap-1.5">
        <Eye className="h-4 w-4" />
        {viewCount.toLocaleString()} {t.views}
      </span>
      <LikeButton
        targetType="TOOL"
        targetId={toolId}
        likeCount={likeCount}
        liked={liked}
      />
    </div>
  );
}
