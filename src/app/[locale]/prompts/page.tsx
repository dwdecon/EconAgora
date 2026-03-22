"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/cloudbase";
import { extractRowId, normalizeTags } from "@/lib/rdb-utils";
import PromptCard from "@/components/prompts/PromptCard";
import PromptFilters from "@/components/prompts/PromptFilters";
import Pagination from "@/components/shared/Pagination";

const PAGE_SIZE = 12;

interface Prompt {
  id: string;
  title: string;
  description: string | null;
  category: string;
  tags: string[];
  likeCount: number;
  downloadCount: number;
  authorId: string;
  createdAt: string;
}

interface Author {
  id: string;
  name: string;
  avatar: string | null;
}

export default function PromptsPage() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const category = searchParams.get("category") || "";
  const tag = searchParams.get("tag") || "";
  const search = searchParams.get("search") || "";

  const [prompts, setPrompts] = useState<(Prompt & { author: Author })[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchPrompts() {
      setLoading(true);

      try {
        let countQuery = db
          .from("prompt")
          .select("_id", { count: "exact" })
          .eq("status", "PUBLISHED");
        let dataQuery = db.from("prompt").select("*").eq("status", "PUBLISHED");

        if (category) {
          countQuery = countQuery.eq("category", category);
          dataQuery = dataQuery.eq("category", category);
        }
        if (tag) {
          countQuery = countQuery.contains("tags", [tag]);
          dataQuery = dataQuery.contains("tags", [tag]);
        }
        if (search) {
          countQuery = countQuery.ilike("title", `%${search}%`);
          dataQuery = dataQuery.ilike("title", `%${search}%`);
        }

        const [countResponse, promptResponse] = await Promise.all([
          countQuery,
          dataQuery
            .order("created_at", { ascending: false })
            .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
        ]);

        if (cancelled) return;
        if (countResponse.error || promptResponse.error) {
          setPrompts([]);
          setTotalPages(1);
          return;
        }

        const total = countResponse.count ?? 0;
        setTotalPages(Math.max(1, Math.ceil(total / PAGE_SIZE)));

        const promptRows = (promptResponse.data as any[]) || [];
        const authorIds = Array.from(
          new Set(promptRows.map((prompt) => String(prompt.author_id))),
        );
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

        setPrompts(
          promptRows
            .map((prompt) => {
              const id = extractRowId(prompt);
              if (!id) return null;

              return {
                id,
                title: prompt.title,
                description: prompt.description,
                category: prompt.category,
                tags: normalizeTags(prompt.tags),
                likeCount: prompt.like_count ?? 0,
                downloadCount: prompt.download_count ?? 0,
                authorId: prompt.author_id,
                createdAt: prompt.created_at,
                author:
                  authorMap[prompt.author_id] ?? {
                    id: prompt.author_id,
                    name: "Unknown user",
                    avatar: null,
                  },
              };
            })
            .filter(Boolean) as (Prompt & { author: Author })[],
        );
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch prompts:", error);
          setPrompts([]);
          setTotalPages(1);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchPrompts();
    return () => {
      cancelled = true;
    };
  }, [page, category, tag, search]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12">
        <p className="py-20 text-center text-gray-text">Loading prompts...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Prompt Library</h1>
        <Link
          href="/prompts/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover"
        >
          Publish Prompt
        </Link>
      </div>
      <PromptFilters />
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {prompts.map((prompt) => (
          <PromptCard key={prompt.id} prompt={prompt} />
        ))}
      </div>
      {prompts.length === 0 ? (
        <p className="py-20 text-center text-gray-text">No prompts found.</p>
      ) : null}
      <Pagination currentPage={page} totalPages={totalPages} basePath="/prompts" />
    </div>
  );
}
