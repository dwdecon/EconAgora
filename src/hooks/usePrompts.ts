"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/cloudbase";
import { normalizeTags } from "@/lib/rdb-utils";

interface Prompt {
  _id: string;
  title: string;
  content: string;
  description?: string;
  category: string;
  tags?: string[];
  locale?: string;
  status?: string;
  download_count?: number;
  like_count?: number;
  author_id: string;
  created_at: string;
  updated_at: string;
}

export function usePrompts(params: { page?: number; pageSize?: number; category?: string; status?: string } = {}) {
  const { page = 1, pageSize = 10, category, status } = params;
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchPrompts = useCallback(async () => {
    setLoading(true);
    try {
      let query = db.from("prompt").select("*");
      if (status) query = query.eq("status", status);
      if (category) query = query.eq("category", category);
      query = query.order("created_at", { ascending: false });
      query = query.range((page - 1) * pageSize, page * pageSize - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      setPrompts(
        ((data as Prompt[]) || []).map((prompt) => ({
          ...prompt,
          tags: normalizeTags(prompt.tags),
        })),
      );
      setTotal(count ?? 0);
    } catch (error) {
      console.error("Failed to fetch prompts:", error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, category, status]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  return { prompts, loading, refetch: fetchPrompts, total };
}
