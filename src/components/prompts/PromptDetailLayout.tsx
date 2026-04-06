"use client";

import { useEffect, useRef } from "react";
import { Eye } from "lucide-react";
import { Link } from "@/i18n/navigation";
import PageShell from "@/components/layout/PageShell";
import CopyPromptButton from "@/components/prompts/CopyPromptButton";
import LikeButton from "@/components/shared/LikeButton";
import CommentSection from "@/components/shared/CommentSection";
import TagBadge from "@/components/shared/TagBadge";

interface Prompt {
  id: string;
  title: string;
  description: string | null;
  content: string;
  category: string;
  tags: string[];
  likeCount: number;
  viewCount: number;
  updatedAt: string; // updated_at，fallback 到 created_at
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

interface PromptDetailLayoutProps {
  prompt: Prompt;
  comments: Comment[];
  liked: boolean;
  isLoggedIn: boolean;
  locale: string;
}

export default function PromptDetailLayout({
  prompt,
  comments,
  liked,
  isLoggedIn,
  locale,
}: PromptDetailLayoutProps) {
  const viewTracked = useRef(false);

  // 依赖 [prompt.id]：prompt 切换时重新计数。
  // useRef 在 React 18 Strict Mode 双重挂载时会被重置，导致开发环境每次页面加载
  // 触发两次 POST——属于预期行为，生产环境不会发生。
  useEffect(() => {
    if (viewTracked.current) return;
    viewTracked.current = true;
    fetch(`/api/prompts/${prompt.id}/view`, { method: "POST" }).catch(() => {});
  }, [prompt.id]);

  const copyLabel = locale === "en" ? "Copy" : "复制";
  const copiedLabel = locale === "en" ? "Copied" : "已复制";
  const initials = prompt.author.name.charAt(0).toUpperCase();
  const formattedDate = new Date(prompt.updatedAt).toLocaleDateString(
    locale === "en" ? "en-US" : "zh-CN",
    { year: "numeric", month: "short", day: "numeric" },
  );

  return (
    <PageShell width="6xl" className="pb-20">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* ── 左栏 ── */}
        <div className="min-w-0 flex-1">
          {/* 标题区 */}
          <span className="font-mono text-xs text-primary">{prompt.category}</span>
          <h1 className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">
            {prompt.title}
          </h1>
          {prompt.description && (
            <p className="mt-2 text-[var(--color-text-secondary)]">{prompt.description}</p>
          )}

          {/* 作者 */}
          <div className="mt-4 flex items-center gap-2">
            <Link
              href={`/u/${prompt.author.id}`}
              className="flex items-center gap-2 transition hover:opacity-80"
            >
              {prompt.author.avatar ? (
                <img
                  src={prompt.author.avatar}
                  alt={prompt.author.name}
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                  {initials}
                </div>
              )}
              <span className="text-sm font-medium text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]">
                {prompt.author.name}
              </span>
            </Link>
          </div>

          <hr className="my-6 border-[var(--color-border)]" />

          {/* Prompt 内容块 */}
          <div className="overflow-hidden rounded-[18px] border border-[var(--color-border)] bg-[var(--color-bg-surface)]">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                Prompt
              </span>
              <CopyPromptButton
                content={prompt.content}
                copyLabel={copyLabel}
                copiedLabel={copiedLabel}
                stopPropagation={false}
              />
            </div>
            <div className="px-4 py-4">
              <pre className="min-h-[120px] whitespace-pre-wrap break-words font-mono text-[13px] leading-6 text-[var(--color-text-primary)]">
                {prompt.content}
              </pre>
            </div>
          </div>

          {/* 评论区 */}
          <CommentSection
            targetType="PROMPT"
            targetId={prompt.id}
            comments={comments}
            isLoggedIn={isLoggedIn}
          />
        </div>

        {/* ── 右侧边栏 ── */}
        <aside className="flex w-full flex-col gap-4 lg:w-64 lg:shrink-0 lg:self-start lg:sticky lg:top-24">
          {/* 关于卡片 */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
            <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
              {locale === "en" ? "About" : "关于"}
            </h3>
            <dl className="flex flex-col gap-3 text-sm">
              <div>
                <dt className="mb-1 text-xs text-[var(--color-text-secondary)]">
                  {locale === "en" ? "Last updated" : "最后更新"}
                </dt>
                <dd className="text-[var(--color-text-primary)]">{formattedDate}</dd>
              </div>
              <div>
                <dt className="mb-1 text-xs text-[var(--color-text-secondary)]">
                  {locale === "en" ? "Category" : "分类"}
                </dt>
                <dd className="font-mono text-xs text-primary">{prompt.category}</dd>
              </div>
              {prompt.tags.length > 0 && (
                <div>
                  <dt className="mb-1 text-xs text-[var(--color-text-secondary)]">
                    {locale === "en" ? "Tags" : "标签"}
                  </dt>
                  <dd className="flex flex-wrap gap-1">
                    {prompt.tags.map((tag) => (
                      <TagBadge key={tag} tag={tag} />
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* 统计卡片 */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
            <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
              {locale === "en" ? "Statistics" : "统计"}
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <Eye className="h-4 w-4 shrink-0" />
                <span>{locale === "en" ? "Views" : "观看"}</span>
                <span className="ml-auto font-medium text-[var(--color-text-primary)]">
                  {(prompt.viewCount ?? 0).toLocaleString()}
                </span>
              </div>
              <LikeButton
                targetType="PROMPT"
                targetId={prompt.id}
                likeCount={prompt.likeCount}
                liked={liked}
                variant="star"
              />
            </div>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
