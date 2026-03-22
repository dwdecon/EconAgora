"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, getSessionUser } from "@/lib/cloudbase";
import { normalizeTags } from "@/lib/rdb-utils";
import CommentSection from "@/components/shared/CommentSection";
import LikeButton from "@/components/shared/LikeButton";
import TagBadge from "@/components/shared/TagBadge";

interface Post {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  is_agent_post: boolean;
  like_count: number;
  created_at: string;
  author_id: string;
}

interface Author {
  id: string;
  name: string;
  avatar: string | null;
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

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [post, setPost] = useState<Post | null>(null);
  const [author, setAuthor] = useState<Author | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [liked, setLiked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);

      try {
        const { data: postData, error: postError } = await db
          .from("post")
          .select("*")
          .eq("_id", id)
          .single();

        if (cancelled) return;
        if (postError || !postData) {
          router.replace("/community");
          return;
        }

        const normalizedPost = {
          ...(postData as Post),
          tags: normalizeTags((postData as any).tags),
        };
        setPost(normalizedPost);

        const { data: authorData } = await db
          .from("user_profile")
          .select("cloudbase_uid, name, avatar")
          .eq("cloudbase_uid", normalizedPost.author_id)
          .single();

        if (!cancelled) {
          setAuthor(
            authorData
              ? {
                  id: (authorData as any).cloudbase_uid,
                  name: (authorData as any).name,
                  avatar: (authorData as any).avatar,
                }
              : {
                  id: normalizedPost.author_id,
                  name: "Unknown user",
                  avatar: null,
                },
          );
        }

        const sessionUser = await getSessionUser();
        if (cancelled) return;
        setIsLoggedIn(Boolean(sessionUser));

        if (sessionUser) {
          const { data: likeRow } = await db
            .from("user_like")
            .select("_id")
            .eq("user_id", sessionUser.id)
            .eq("target_type", "POST")
            .eq("target_id", id)
            .single();

          if (!cancelled) {
            setLiked(Boolean(likeRow));
          }
        } else {
          setLiked(false);
        }

        const { data: commentRows } = await db
          .from("comment")
          .select("*")
          .eq("target_type", "POST")
          .eq("target_id", id)
          .order("created_at", { ascending: true });

        const rows = (commentRows as any[]) || [];
        if (rows.length === 0) {
          if (!cancelled) {
            setComments([]);
          }
          return;
        }

        const authorIds = [...new Set(rows.map((comment) => comment.author_id))];
        const authorMap: Record<string, Author> = {};

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

        for (const row of rows) {
          commentMap[row._id] = {
            id: row._id,
            content: row.content,
            created_at: row.created_at,
            is_agent_comment: row.is_agent_comment ?? false,
            user_id: row.author_id,
            author:
              authorMap[row.author_id] ?? {
                id: row.author_id,
                name: "Unknown user",
                avatar: null,
              },
            replies: [],
          };
        }

        for (const row of rows) {
          if (row.parent_id && commentMap[row.parent_id]) {
            commentMap[row.parent_id].replies!.push(commentMap[row._id]);
          } else {
            rootComments.push(commentMap[row._id]);
          }
        }

        setComments(rootComments);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch post detail:", error);
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
  }, [id, router]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <p className="py-20 text-center text-gray-text">Loading post...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <p className="py-20 text-center text-gray-text">Post not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-4 flex items-center gap-2">
        <span className="font-semibold">{author?.name || "Unknown user"}</span>
        {post.is_agent_post ? (
          <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs text-primary">
            via AI Agent
          </span>
        ) : null}
        <span className="ml-auto text-sm text-gray-text">
          {new Date(post.created_at).toLocaleDateString()}
        </span>
      </div>
      <h1 className="text-3xl font-bold">{post.title}</h1>
      <div className="mt-3 flex flex-wrap gap-1">
        {post.tags.map((tag) => (
          <TagBadge key={tag} tag={tag} />
        ))}
      </div>
      <div className="prose prose-invert mt-8 max-w-none">
        <p className="whitespace-pre-wrap text-gray-text">{post.content}</p>
      </div>
      <div className="mt-6">
        <LikeButton
          targetType="POST"
          targetId={id}
          likeCount={post.like_count ?? 0}
          liked={liked}
        />
      </div>
      <CommentSection
        targetType="POST"
        targetId={id}
        comments={comments}
        isLoggedIn={isLoggedIn}
      />
    </div>
  );
}
