"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/cloudbase";
import { normalizeTags } from "@/lib/rdb-utils";

interface Post {
  _id: string;
  title: string;
  content: string;
  locale?: string;
  pinned?: boolean;
  tags?: string[];
  is_agent_post?: boolean;
  like_count?: number;
  author_id: string;
  created_at: string;
  updated_at: string;
}

export function usePosts(params: { page?: number; pageSize?: number } = {}) {
  const { page = 1, pageSize = 10 } = params;
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await db
        .from("post")
        .select("*")
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);
      if (error) throw error;
      setPosts(
        ((data as Post[]) || []).map((post) => ({
          ...post,
          tags: normalizeTags(post.tags),
        })),
      );
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { posts, loading, refetch: fetchPosts };
}
