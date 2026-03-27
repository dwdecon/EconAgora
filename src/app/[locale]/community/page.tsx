"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import PageShell from "@/components/layout/PageShell";
import { db } from "@/lib/cloudbase";
import { normalizeTags } from "@/lib/rdb-utils";
import PostCard from "@/components/community/PostCard";
import Pagination from "@/components/shared/Pagination";

const PAGE_SIZE = 10;

interface PostRow {
  _id: string;
  title: string;
  content: string;
  tags: string[] | string | null;
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

interface PostCardData {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isAgentPost: boolean;
  likeCount: number;
  createdAt: Date;
  author: Author;
  _count: { comments: number };
}

export default function CommunityPage() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;

  const [posts, setPosts] = useState<PostCardData[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchPosts() {
      setLoading(true);

      try {
        const [countResponse, postsResponse] = await Promise.all([
          db.from("post").select("_id", { count: "exact" }),
          db.from("post")
            .select("*")
            .order("created_at", { ascending: false })
            .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
        ]);

        if (cancelled) return;
        if (countResponse.error || postsResponse.error) {
          setPosts([]);
          setTotalPages(1);
          return;
        }

        const rows = (postsResponse.data as PostRow[]) || [];
        const total = countResponse.count ?? 0;
        setTotalPages(Math.max(1, Math.ceil(total / PAGE_SIZE)));

        const authorIds = [...new Set(rows.map((post) => post.author_id))];
        const authorMap: Record<string, Author> = {};

        await Promise.all(
          authorIds.map(async (uid) => {
            const { data: profile } = await db
              .from("user_profile")
              .select("cloudbase_uid, name, avatar")
              .eq("cloudbase_uid", uid)
              .single();

            authorMap[uid] = profile
              ? {
                  id: uid,
                  name: (profile as any).name,
                  avatar: (profile as any).avatar,
                }
              : { id: uid, name: "Unknown user", avatar: null };
          }),
        );

        const postIds = rows.map((post) => post._id);
        const commentCountMap: Record<string, number> = {};

        if (postIds.length > 0) {
          const { data: commentRows } = await db
            .from("comment")
            .select("target_id")
            .eq("target_type", "POST")
            .in("target_id", postIds);

          for (const comment of ((commentRows as { target_id: string }[]) || [])) {
            commentCountMap[comment.target_id] =
              (commentCountMap[comment.target_id] || 0) + 1;
          }
        }

        setPosts(
          rows.map((post) => ({
            id: post._id,
            title: post.title,
            content: post.content,
            tags: normalizeTags(post.tags),
            isAgentPost: post.is_agent_post ?? false,
            likeCount: post.like_count ?? 0,
            createdAt: new Date(post.created_at),
            author:
              authorMap[post.author_id] ?? {
                id: post.author_id,
                name: "Unknown user",
                avatar: null,
              },
            _count: { comments: commentCountMap[post._id] ?? 0 },
          })),
        );
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch posts:", error);
          setPosts([]);
          setTotalPages(1);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchPosts();
    return () => {
      cancelled = true;
    };
  }, [page]);

  if (loading) {
    return (
      <PageShell width="3xl">
        <p className="py-20 text-center text-[var(--color-text-secondary)]">Loading posts...</p>
      </PageShell>
    );
  }

  return (
    <PageShell width="3xl">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Community</h1>
        <Link
          href="/community/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover"
        >
          New Post
        </Link>
      </div>
      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
      {posts.length === 0 ? (
        <p className="py-20 text-center text-[var(--color-text-secondary)]">No posts yet.</p>
      ) : null}
      <Pagination currentPage={page} totalPages={totalPages} basePath="/community" />
    </PageShell>
  );
}
