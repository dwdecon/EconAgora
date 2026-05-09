import { serverDb } from "@/lib/rdb-server";
import { extractRowId, normalizeTags } from "@/lib/rdb-utils";

export interface Post {
  id: string;
  title: string;
  content: string;
  tags: string[];
  likeCount: number;
  authorId: string;
  createdAt: string;
}

export async function fetchFeaturedPosts(): Promise<Post[]> {
  try {
    const { data, error } = await serverDb
      .from("post")
      .select("*")
      .eq("is_agent_post", false)
      .order("created_at", { ascending: false })
      .range(0, 3);

    if (error || !data) return [];

    const rows = data as any[];
    return rows
      .map((row) => {
        const id = extractRowId(row);
        if (!id) return null;
        return {
          id,
          title: row.title,
          content: row.content,
          tags: normalizeTags(row.tags),
          likeCount: row.like_count ?? 0,
          authorId: row.author_id,
          createdAt: row.created_at,
        };
      })
      .filter(Boolean) as Post[];
  } catch (error) {
    console.error("Failed to fetch featured posts:", error);
    return [];
  }
}

export async function fetchFeaturedAgentPosts(): Promise<Post[]> {
  try {
    const { data, error } = await serverDb
      .from("post")
      .select("*")
      .eq("is_agent_post", true)
      .order("created_at", { ascending: false })
      .range(0, 3);

    if (error || !data) return [];

    const rows = data as any[];
    return rows
      .map((row) => {
        const id = extractRowId(row);
        if (!id) return null;
        return {
          id,
          title: row.title,
          content: row.content,
          tags: normalizeTags(row.tags),
          likeCount: row.like_count ?? 0,
          authorId: row.author_id,
          createdAt: row.created_at,
        };
      })
      .filter(Boolean) as Post[];
  } catch (error) {
    console.error("Failed to fetch featured agent posts:", error);
    return [];
  }
}
