import { serverDb } from "@/lib/rdb-server";
import { extractRowId, normalizeTags } from "@/lib/rdb-utils";

export interface Prompt {
  id: string;
  title: string;
  description: string | null;
  category: string;
  tags: string[];
  content: string;
  likeCount: number;
  downloadCount: number;
  authorId: string;
  createdAt: string;
}

export async function fetchFeaturedPrompts(): Promise<Prompt[]> {
  try {
    const { data, error } = await serverDb
      .from("prompt")
      .select("*")
      .eq("status", "PUBLISHED")
      .order("like_count", { ascending: false })
      .range(0, 3); // 获取前 4 个最受欢迎的

    if (error || !data) return [];

    const rows = data as any[];
    return rows
      .map((row) => {
        const id = extractRowId(row);
        if (!id) return null;
        return {
          id,
          title: row.title,
          description: row.description,
          category: row.category,
          tags: normalizeTags(row.tags),
          content: row.content,
          likeCount: row.like_count ?? 0,
          downloadCount: row.download_count ?? 0,
          authorId: row.author_id,
          createdAt: row.created_at,
        };
      })
      .filter(Boolean) as Prompt[];
  } catch (error) {
    console.error("Failed to fetch featured prompts:", error);
    return [];
  }
}
