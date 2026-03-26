"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Plus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import PageShell from "@/components/layout/PageShell";
import PromptFilters from "@/components/prompts/PromptFilters";
import PromptShowcaseCard from "@/components/prompts/PromptShowcaseCard";
import Pagination from "@/components/shared/Pagination";
import Reveal from "@/components/shared/Reveal";
import { db } from "@/lib/cloudbase";
import { extractRowId, normalizeTags } from "@/lib/rdb-utils";

const PAGE_SIZE = 12;
const SKELETON_COUNT = 4;

function PageHero({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mx-auto mb-8 max-w-2xl relative text-center">
      <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-b from-primary/5 to-transparent blur-xl" />
      <p className="text-sm font-medium text-[var(--color-text-secondary)]">
        Prompt Library
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[var(--color-text-primary)] md:text-5xl">
        {title}
      </h1>
      <p className="mt-4 text-base leading-relaxed text-[var(--color-text-secondary)]">
        {subtitle}
      </p>
    </div>
  );
}

const CreateNewCard = () => (
  <Link
    href="/prompts/new"
    className="group flex min-h-[300px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[var(--color-border)] p-6 text-center transition-colors hover:border-primary/50 hover:bg-[var(--color-bg-surface)]"
  >
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
      <Plus className="h-6 w-6" />
    </div>
    <h3 className="text-lg font-medium text-[var(--color-text-primary)]">Share Your Prompt</h3>
    <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
      Publish your workflow to the community.
    </p>
  </Link>
);

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
      <PageShell width="6xl">
        <PageHero title="Loading..." subtitle="Loading curated prompts..." />
        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <div
              key={i}
              className="h-[260px] animate-pulse rounded-2xl bg-[var(--color-bg-surface-strong)]"
            />
          ))}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell width="6xl">
      <PageHero
        title="Curated Research Prompts"
        subtitle="Browse reusable workflow systems for literature review, data analysis, paper writing, and peer review."
      />

      {/* Filters */}
      <div className="mt-6">
        <PromptFilters />
      </div>

      {/* Grid */}
      {prompts.length > 0 ? (
        <div className="mt-10 flex flex-col gap-8">
          {/* Featured Prompt: Only show index 0 as featured on Page 1 */}
          {page === 1 && prompts[0] && (
            <Reveal delay={0} threshold={0.12}>
              <PromptShowcaseCard prompt={prompts[0]} isFeatured={true} />
            </Reveal>
          )}

          {/* Grid for the rest (or all prompts on page 2+) */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {page === 1 && (
              <Reveal delay={70} threshold={0.12}>
                <CreateNewCard />
              </Reveal>
            )}
            {(page === 1 ? prompts.slice(1) : prompts).map((prompt, index) => (
              <Reveal
                key={prompt.id}
                delay={Math.min((index + (page === 1 ? 2 : 1)) * 70, 280)}
                threshold={0.12}
              >
                <PromptShowcaseCard prompt={prompt} isFeatured={false} />
              </Reveal>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-16 text-center">
          <p className="text-lg font-medium text-[var(--color-text-primary)]">
            No prompts found
          </p>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Try a different category, clear your filters, or search with broader
            terms.
          </p>
        </div>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        basePath="/prompts"
        queryString={searchParams.toString()}
      />
    </PageShell>
  );
}
