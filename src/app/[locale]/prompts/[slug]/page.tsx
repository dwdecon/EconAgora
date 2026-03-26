"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getShowcaseArticle } from "@/components/landing/content";
import { db, getSessionUser } from "@/lib/cloudbase";
import { normalizeTags } from "@/lib/rdb-utils";
import CommentSection from "@/components/shared/CommentSection";
import LikeButton from "@/components/shared/LikeButton";
import TagBadge from "@/components/shared/TagBadge";
import ArticleLayout from "@/components/shared/ArticleLayout";

/* ── Types ─────────────────────────────────────────────── */

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
  author: { id: string; name: string; avatar: string | null };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  is_agent_comment: boolean;
  user_id: string;
  author: { id: string; name: string; avatar: string | null };
  replies?: Comment[];
}

/* ── Page ──────────────────────────────────────────────── */

export default function PromptDetailPage() {
  const { slug, locale } = useParams<{ slug: string; locale: string }>();

  /* 1. Static showcase article (instant, no DB) */
  const staticArticle = getShowcaseArticle(slug, locale);
  if (staticArticle) {
    return (
      <ArticleLayout>
        <div className="mb-4 flex flex-wrap gap-2">
          {staticArticle.tags.map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>
        <div dangerouslySetInnerHTML={{ __html: staticArticle.articleContent }} />
      </ArticleLayout>
    );
  }

  /* 2. DB-backed prompt (user-generated content) */
  return <DbPromptDetail id={slug} />;
}

/* ── DB detail (unchanged logic, extracted to sub-component) ── */

function DbPromptDetail({ id }: { id: string }) {
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

          if (!cancelled) setLiked(Boolean(likeData));
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
          if (!cancelled) setComments([]);
          return;
        }

        const authorIds = Array.from(
          new Set(commentList.map((c) => String(c.author_id))),
        );
        const authorMap: Record<string, { id: string; name: string; avatar: string | null }> = {};

        if (authorIds.length > 0) {
          const { data: profiles } = await db
            .from("user_profile")
            .select("cloudbase_uid, name, avatar")
            .in("cloudbase_uid", authorIds);

          for (const p of (profiles as any[]) || []) {
            authorMap[p.cloudbase_uid] = {
              id: p.cloudbase_uid,
              name: p.name,
              avatar: p.avatar,
            };
          }
        }

        if (cancelled) return;

        const commentMap: Record<string, Comment> = {};
        const rootComments: Comment[] = [];

        for (const c of commentList) {
          commentMap[c._id] = {
            id: c._id,
            content: c.content,
            created_at: c.created_at,
            is_agent_comment: c.is_agent_comment ?? false,
            user_id: c.author_id,
            author: authorMap[c.author_id] ?? { id: c.author_id, name: "Unknown user", avatar: null },
            replies: [],
          };
        }

        for (const c of commentList) {
          if (c.parent_id && commentMap[c.parent_id]) {
            commentMap[c.parent_id].replies!.push(commentMap[c._id]);
          } else {
            rootComments.push(commentMap[c._id]);
          }
        }

        setComments(rootComments);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch prompt:", error);
          setMissing(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <ArticleLayout>
        <p className="py-20 text-center text-gray-text">Loading prompt...</p>
      </ArticleLayout>
    );
  }

  if (missing || !prompt) {
    return (
      <ArticleLayout>
        <p className="py-20 text-center text-gray-text">Prompt not found.</p>
      </ArticleLayout>
    );
  }

  return (
    <ArticleLayout>
      <span className="font-mono text-xs text-primary">{prompt.category}</span>
      <h2 className="!mt-2">{prompt.title}</h2>
      {prompt.description ? <p>{prompt.description}</p> : null}
      <div className="flex items-center gap-3 text-sm text-[#666]">
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

      <pre className="mt-8">{prompt.content}</pre>

      <div className="mt-6 flex gap-3">
        <LikeButton
          targetType="PROMPT"
          targetId={id}
          likeCount={prompt.likeCount}
          liked={liked}
        />
        <a
          href={`/api/prompts/${id}/download`}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-[#A1A1AA] transition hover:text-white"
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
    </ArticleLayout>
  );
}
