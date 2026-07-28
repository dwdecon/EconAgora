"use client";

import { useEffect, useState, type ReactElement } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/cloudbase";
import { extractRowId } from "@/lib/rdb-utils";

interface Prompt {
  _id: string;
  title: string;
  category: string;
  like_count: number;
  view_count: number;
  created_at: string;
}

interface Post {
  _id: string;
  title: string;
  like_count: number;
  created_at: string;
}

interface Skill {
  _id: string;
  title: string;
  category: string;
  like_count: number;
  view_count: number;
  created_at: string;
}

interface Tool {
  _id: string;
  title: string;
  category: string;
  like_count: number;
  view_count: number;
  created_at: string;
}

interface MyContentSectionProps {
  userId: string;
}

const i18n = {
  zh: {
    title: "我的内容",
    prompts: "已发布 Prompt",
    posts: "已发布帖子",
    skills: "已发布 Skills",
    tools: "已发布 Tools",
    emptyPrompts: "暂时还没有已发布的 Prompt",
    emptyPosts: "暂时还没有已发布的帖子",
    emptySkills: "暂时还没有已发布的 Skills",
    emptyTools: "暂时还没有已发布的 Tools",
    views: "浏览",
    likes: "点赞",
    goToPrompt: "查看 Prompt",
    goToPost: "查看帖子",
    goToSkill: "查看 Skill",
    goToTool: "查看 Tool",
  },
  en: {
    title: "My Content",
    prompts: "Published Prompts",
    posts: "Published Posts",
    skills: "Published Skills",
    tools: "Published Tools",
    emptyPrompts: "No published prompts yet",
    emptyPosts: "No published posts yet",
    emptySkills: "No published skills yet",
    emptyTools: "No published tools yet",
    views: "Views",
    likes: "Likes",
    goToPrompt: "View Prompt",
    goToPost: "View Post",
    goToSkill: "View Skill",
    goToTool: "View Tool",
  },
} as const;

function formatDate(dateStr: string, locale: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale === "en" ? "en-US" : "zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function LoadingBlock() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-text-primary)] border-t-transparent" />
    </div>
  );
}

function ItemMeta({
  category,
  viewsLabel,
  likesLabel,
  views,
  likes,
  createdAt,
  locale,
}: {
  category?: string;
  viewsLabel: string;
  likesLabel: string;
  views?: number;
  likes: number;
  createdAt: string;
  locale: string;
}) {
  return (
    <div className="mt-0.5 flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
      {category ? (
        <>
          <span>{category}</span>
          <span>·</span>
        </>
      ) : null}
      {typeof views === "number" ? (
        <>
          <span>{viewsLabel}: {views}</span>
          <span>·</span>
        </>
      ) : null}
      <span>{likesLabel}: {likes}</span>
      <span>·</span>
      <span>{formatDate(createdAt, locale)}</span>
    </div>
  );
}

function ContentList<T extends { _id: string; title: string; created_at: string }>({
  items,
  emptyText,
  ctaLabel,
  buildHref,
  locale,
  renderMeta,
}: {
  items: T[];
  emptyText: string;
  ctaLabel: string;
  buildHref: (item: T) => string;
  locale: string;
  renderMeta: (item: T, locale: string) => ReactElement;
}) {
  if (items.length === 0) {
    return <p className="py-4 text-sm text-[var(--color-text-muted)]">{emptyText}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <div
          key={item._id}
          className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3"
        >
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-[var(--color-text-primary)]">
              {item.title}
            </div>
            {renderMeta(item, locale)}
          </div>
          <Link
            href={buildHref(item)}
            className="ml-4 shrink-0 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-primary)]"
          >
            {ctaLabel}
          </Link>
        </div>
      ))}
    </div>
  );
}

export default function MyContentSection({ userId }: MyContentSectionProps) {
  const locale = useLocale();
  const t = i18n[locale === "en" ? "en" : "zh"];

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);

  const [loadingPrompts, setLoadingPrompts] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [loadingTools, setLoadingTools] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadPrompts() {
      try {
        const { data, error } = await db
          .from("prompt")
          .select("*")
          .eq("author_id", userId)
          .eq("status", "PUBLISHED")
          .order("created_at", { ascending: false })
          .limit(20);

        if (!error && data && !cancelled) {
          setPrompts(data as unknown as Prompt[]);
        }
      } finally {
        if (!cancelled) setLoadingPrompts(false);
      }
    }

    async function loadPosts() {
      try {
        const { data, error } = await db
          .from("post")
          .select("*")
          .eq("author_id", userId)
          .order("created_at", { ascending: false })
          .limit(20);

        if (!error && data && !cancelled) {
          setPosts(data as unknown as Post[]);
        }
      } finally {
        if (!cancelled) setLoadingPosts(false);
      }
    }

    async function loadSkills() {
      try {
        const { data, error } = await db
          .from("skill")
          .select("*")
          .eq("author_id", userId)
          .eq("status", "PUBLISHED")
          .order("created_at", { ascending: false })
          .limit(20);

        if (!error && data && !cancelled) {
          setSkills(data as unknown as Skill[]);
        }
      } finally {
        if (!cancelled) setLoadingSkills(false);
      }
    }

    async function loadTools() {
      try {
        const { data, error } = await db
          .from("tool")
          .select("*")
          .eq("author_id", userId)
          .eq("status", "PUBLISHED")
          .order("created_at", { ascending: false })
          .limit(20);

        if (!error && data && !cancelled) {
          setTools(data as unknown as Tool[]);
        }
      } finally {
        if (!cancelled) setLoadingTools(false);
      }
    }

    loadPrompts();
    loadPosts();
    loadSkills();
    loadTools();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
      <h2 className="mb-6 text-lg font-semibold text-[var(--color-text-primary)]">
        {t.title}
      </h2>

      <div className="mb-8">
        <h3 className="mb-3 text-sm font-medium text-[var(--color-text-secondary)]">
          {t.prompts}
        </h3>
        {loadingPrompts ? (
          <LoadingBlock />
        ) : (
          <ContentList
            items={prompts}
            emptyText={t.emptyPrompts}
            ctaLabel={t.goToPrompt}
            buildHref={(prompt) => `/prompts/${extractRowId(prompt) ?? prompt._id}`}
            locale={locale}
            renderMeta={(prompt, currentLocale) => (
              <ItemMeta
                category={prompt.category}
                viewsLabel={t.views}
                likesLabel={t.likes}
                views={prompt.view_count ?? 0}
                likes={prompt.like_count ?? 0}
                createdAt={prompt.created_at}
                locale={currentLocale}
              />
            )}
          />
        )}
      </div>

      <div className="mb-8">
        <h3 className="mb-3 text-sm font-medium text-[var(--color-text-secondary)]">
          {t.posts}
        </h3>
        {loadingPosts ? (
          <LoadingBlock />
        ) : (
          <ContentList
            items={posts}
            emptyText={t.emptyPosts}
            ctaLabel={t.goToPost}
            buildHref={(post) => `/community/${post._id}`}
            locale={locale}
            renderMeta={(post, currentLocale) => (
              <ItemMeta
                viewsLabel={t.views}
                likesLabel={t.likes}
                likes={post.like_count ?? 0}
                createdAt={post.created_at}
                locale={currentLocale}
              />
            )}
          />
        )}
      </div>

      <div className="mb-8">
        <h3 className="mb-3 text-sm font-medium text-[var(--color-text-secondary)]">
          {t.skills}
        </h3>
        {loadingSkills ? (
          <LoadingBlock />
        ) : (
          <ContentList
            items={skills}
            emptyText={t.emptySkills}
            ctaLabel={t.goToSkill}
            buildHref={(skill) => `/skills/${extractRowId(skill) ?? skill._id}`}
            locale={locale}
            renderMeta={(skill, currentLocale) => (
              <ItemMeta
                category={skill.category}
                viewsLabel={t.views}
                likesLabel={t.likes}
                views={skill.view_count ?? 0}
                likes={skill.like_count ?? 0}
                createdAt={skill.created_at}
                locale={currentLocale}
              />
            )}
          />
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-[var(--color-text-secondary)]">
          {t.tools}
        </h3>
        {loadingTools ? (
          <LoadingBlock />
        ) : (
          <ContentList
            items={tools}
            emptyText={t.emptyTools}
            ctaLabel={t.goToTool}
            buildHref={(tool) => `/tools/${encodeURIComponent(extractRowId(tool) ?? tool._id)}`}
            locale={locale}
            renderMeta={(tool, currentLocale) => (
              <ItemMeta
                category={tool.category}
                viewsLabel={t.views}
                likesLabel={t.likes}
                views={tool.view_count ?? 0}
                likes={tool.like_count ?? 0}
                createdAt={tool.created_at}
                locale={currentLocale}
              />
            )}
          />
        )}
      </div>
    </div>
  );
}
