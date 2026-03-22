"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db, getSessionUser } from "@/lib/cloudbase";
import { normalizeTags } from "@/lib/rdb-utils";
import CommentSection from "@/components/shared/CommentSection";
import LikeButton from "@/components/shared/LikeButton";
import TagBadge from "@/components/shared/TagBadge";

interface Prompt {
  id: string;
  title: string;
  description: string | null;
  content: string;
  category: string;
  tags: string[];
  likeCount: number;
  downloadCount: number;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  is_agent_comment: boolean;
  user_id: string;
  author: {
    id: string;
    name: string;
    avatar: string | null;
  };
  replies?: Comment[];
}

export default function PromptDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [liked, setLiked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setMissing(false);

      try {
        const { data: promptData, error: promptError } = await db
          .from("prompt")
          .select("*")
          .eq("_id", id)
          .single();

        if (cancelled) return;
        if (promptError || !promptData) {
          setPrompt(null);
          setComments([]);
          setMissing(true);
          return;
        }

        const { data: authorData } = await db
          .from("user_profile")
          .select("cloudbase_uid, name, avatar")
          .eq("cloudbase_uid", (promptData as any).author_id)
          .single();

        const author = authorData
          ? {
              id: (authorData as any).cloudbase_uid,
              name: (authorData as any).name,
              avatar: (authorData as any).avatar,
            }
          : {
              id: (promptData as any).author_id,
              name: "Unknown user",
              avatar: null,
            };

        setPrompt({
          id: (promptData as any)._id,
          title: (promptData as any).title,
          description: (promptData as any).description,
          content: (promptData as any).content,
          category: (promptData as any).category,
          tags: normalizeTags((promptData as any).tags),
          likeCount: (promptData as any).like_count ?? 0,
          downloadCount: (promptData as any).download_count ?? 0,
          createdAt: (promptData as any).created_at,
          author,
        });

        const sessionUser = await getSessionUser();
        if (cancelled) return;
        setIsLoggedIn(Boolean(sessionUser));

        if (sessionUser) {
          const { data: likeData } = await db
            .from("user_like")
            .select("_id")
            .eq("user_id", sessionUser.id)
            .eq("target_type", "PROMPT")
            .eq("target_id", id)
            .single();

          if (!cancelled) {
            setLiked(Boolean(likeData));
          }
        } else {
          setLiked(false);
        }

        const { data: commentRows } = await db
          .from("comment")
          .select("*")
          .eq("target_type", "PROMPT")
          .eq("target_id", id)
          .order("created_at", { ascending: true });

        const commentList = (commentRows as any[]) || [];
        if (commentList.length === 0) {
          if (!cancelled) {
            setComments([]);
          }
          return;
        }

        const authorIds = Array.from(
          new Set(commentList.map((comment) => String(comment.author_id))),
        );
        const authorMap: Record<string, { id: string; name: string; avatar: string | null }> =
          {};

        await Promise.all(
          authorIds.map(async (uid) => {
            const { data } = await db
              .from("user_profile")
              .select("cloudbase_uid, name, avatar")
              .eq("cloudbase_uid", uid)
              .single();

            authorMap[uid] = data
              ? {
                  id: (data as any).cloudbase_uid,
                  name: (data as any).name,
                  avatar: (data as any).avatar,
                }
              : { id: uid, name: "Unknown user", avatar: null };
          }),
        );

        if (cancelled) return;

        const commentMap: Record<string, Comment> = {};
        const rootComments: Comment[] = [];

        for (const comment of commentList) {
          commentMap[comment._id] = {
            id: comment._id,
            content: comment.content,
            created_at: comment.created_at,
            is_agent_comment: comment.is_agent_comment ?? false,
            user_id: comment.author_id,
            author:
              authorMap[comment.author_id] ?? {
                id: comment.author_id,
                name: "Unknown user",
                avatar: null,
              },
            replies: [],
          };
        }

        for (const comment of commentList) {
          if (comment.parent_id && commentMap[comment.parent_id]) {
            commentMap[comment.parent_id].replies!.push(commentMap[comment._id]);
          } else {
            rootComments.push(commentMap[comment._id]);
          }
        }

        setComments(rootComments);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch prompt:", error);
          setMissing(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <p className="py-20 text-center text-gray-text">Loading prompt...</p>
      </div>
    );
  }

  if (missing || !prompt) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <p className="py-20 text-center text-gray-text">Prompt not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <span className="font-mono text-xs text-primary">{prompt.category}</span>
      <h1 className="mt-2 text-3xl font-bold">{prompt.title}</h1>
      {prompt.description ? (
        <p className="mt-3 text-gray-text">{prompt.description}</p>
      ) : null}
      <div className="mt-3 flex items-center gap-3 text-sm text-gray-text">
        <span>{prompt.author.name}</span>
        <span>|</span>
        <span>{new Date(prompt.createdAt).toLocaleDateString()}</span>
        <span>|</span>
        <span>{prompt.downloadCount} downloads</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {prompt.tags.map((tag) => (
          <TagBadge key={tag} tag={tag} />
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-dark-border bg-dark-card p-6">
        <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
          {prompt.content}
        </pre>
      </div>

      <div className="mt-6 flex gap-3">
        <LikeButton
          targetType="PROMPT"
          targetId={id}
          likeCount={prompt.likeCount}
          liked={liked}
        />
        <a
          href={`/api/prompts/${id}/download`}
          className="rounded-lg border border-dark-border px-3 py-1.5 text-sm text-gray-text transition hover:text-white"
        >
          Download .txt
        </a>
      </div>

      <CommentSection
        targetType="PROMPT"
        targetId={id}
        comments={comments}
        isLoggedIn={isLoggedIn}
      />
    </div>
  );
}
