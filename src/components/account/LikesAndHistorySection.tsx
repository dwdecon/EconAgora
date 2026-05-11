"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/cloudbase";
import { extractRowId } from "@/lib/rdb-utils";
import { Heart, Clock, FileText, Users, Wrench, BookOpen, Trash2 } from "lucide-react";

type TargetType = "PROMPT" | "POST" | "SKILL" | "TOOL";

interface LikedItem {
  id: string;
  targetType: TargetType;
  targetId: string;
  title: string;
  category?: string;
  createdAt: string;
}

interface HistoryItem {
  id: string;
  targetType: TargetType;
  targetId: string;
  title: string;
  category?: string;
  visitedAt: number; // timestamp ms
}

interface LikesAndHistorySectionProps {
  userId: string;
}

const i18n = {
  zh: {
    likes: "我的点赞",
    history: "最近浏览",
    emptyLikes: "还没有点赞过任何内容",
    emptyHistory: "暂无浏览记录",
    clearHistory: "清空记录",
    viewItem: "查看",
    types: {
      PROMPT: "Prompt",
      POST: "社区帖子",
      SKILL: "技能",
      TOOL: "工具",
    },
  },
  en: {
    likes: "My Likes",
    history: "Recent History",
    emptyLikes: "No liked content yet",
    emptyHistory: "No browsing history yet",
    clearHistory: "Clear History",
    viewItem: "View",
    types: {
      PROMPT: "Prompt",
      POST: "Community Post",
      SKILL: "Skill",
      TOOL: "Tool",
    },
  },
} as const;

type I18nText = (typeof i18n)[keyof typeof i18n];

const HISTORY_KEY = "econagora_browse_history";
const HISTORY_MAX = 50;

function getTypeIcon(type: TargetType) {
  switch (type) {
    case "PROMPT": return <FileText className="h-3.5 w-3.5" />;
    case "POST": return <Users className="h-3.5 w-3.5" />;
    case "SKILL": return <BookOpen className="h-3.5 w-3.5" />;
    case "TOOL": return <Wrench className="h-3.5 w-3.5" />;
  }
}

function getTypeColor(type: TargetType) {
  switch (type) {
    case "PROMPT": return "border-violet-500/30 bg-violet-500/10 text-violet-400";
    case "POST": return "border-sky-500/30 bg-sky-500/10 text-sky-400";
    case "SKILL": return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
    case "TOOL": return "border-amber-500/30 bg-amber-500/10 text-amber-400";
  }
}

function buildHref(type: TargetType, id: string) {
  switch (type) {
    case "PROMPT": return `/prompts/${id}`;
    case "POST": return `/community/${id}`;
    case "SKILL": return `/skills/${id}`;
    case "TOOL": return `/tools/${id}`;
  }
}

function formatRelativeTime(ts: number, locale: string) {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (locale === "en") {
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } else {
    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return new Date(ts).toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  }
}

function LoadingBlock() {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-text-primary)] border-t-transparent" />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="mb-2 text-3xl opacity-20">✦</div>
      <p className="text-sm text-[var(--color-text-muted)]">{text}</p>
    </div>
  );
}

function ItemRow({
  icon,
  typeLabel,
  typeColor,
  title,
  href,
  meta,
  ctaLabel,
}: {
  icon: React.ReactNode;
  typeLabel: string;
  typeColor: string;
  title: string;
  href: string;
  meta: string;
  ctaLabel: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 transition-colors hover:border-[var(--color-border-hover)]">
      <span
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ${typeColor}`}
      >
        {icon}
        {typeLabel}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-[var(--color-text-primary)]">
          {title}
        </div>
        <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">{meta}</div>
      </div>
      <Link
        href={href}
        className="ml-2 shrink-0 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-primary)]"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

// ── Likes tab ────────────────────────────────────────────────────────────────

async function fetchLikedItems(userId: string): Promise<LikedItem[]> {
  // Fetch all likes for this user
  const { data: likes, error } = await db
    .from("user_like")
    .select("_id,target_type,target_id,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !likes) return [];

  // Group by target type
  const byType: Record<TargetType, string[]> = {
    PROMPT: [], POST: [], SKILL: [], TOOL: [],
  };
  for (const row of likes as { _id: string; target_type: TargetType; target_id: string; created_at: string }[]) {
    byType[row.target_type]?.push(row.target_id);
  }

  // Fetch titles in parallel
  const [promptRes, postRes, skillRes, toolRes] = await Promise.all([
    byType.PROMPT.length
      ? db.from("prompt").select("_id,title,category").in("_id", byType.PROMPT)
      : Promise.resolve({ data: [] }),
    byType.POST.length
      ? db.from("post").select("_id,title").in("_id", byType.POST)
      : Promise.resolve({ data: [] }),
    byType.SKILL.length
      ? db.from("skill").select("_id,title,category").in("_id", byType.SKILL)
      : Promise.resolve({ data: [] }),
    byType.TOOL.length
      ? db.from("tool").select("_id,title,category").in("_id", byType.TOOL)
      : Promise.resolve({ data: [] }),
  ]);

  const titleMap: Record<string, { title: string; category?: string }> = {};
  for (const row of (promptRes.data as { _id: string; title: string; category: string }[] | null) ?? []) {
    titleMap[row._id] = { title: row.title, category: row.category };
  }
  for (const row of (postRes.data as { _id: string; title: string }[] | null) ?? []) {
    titleMap[row._id] = { title: row.title };
  }
  for (const row of (skillRes.data as { _id: string; title: string; category: string }[] | null) ?? []) {
    titleMap[row._id] = { title: row.title, category: row.category };
  }
  for (const row of (toolRes.data as { _id: string; title: string; category: string }[] | null) ?? []) {
    titleMap[row._id] = { title: row.title, category: row.category };
  }

  return (likes as { _id: string; target_type: TargetType; target_id: string; created_at: string }[])
    .map((row) => ({
      id: row._id,
      targetType: row.target_type,
      targetId: row.target_id,
      title: titleMap[row.target_id]?.title ?? row.target_id,
      category: titleMap[row.target_id]?.category,
      createdAt: row.created_at,
    }))
    .filter((item) => titleMap[item.targetId]); // drop orphans
}

function LikesTab({ userId, t }: { userId: string; t: I18nText }) {
  const [items, setItems] = useState<LikedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const locale = useLocale();

  useEffect(() => {
    let cancelled = false;
    fetchLikedItems(userId).then((data) => {
      if (!cancelled) { setItems(data); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [userId]);

  if (loading) return <LoadingBlock />;
  if (items.length === 0) return <EmptyState text={t.emptyLikes} />;

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => {
        const rawId = extractRowId({ _id: item.targetId } as { _id: string }) ?? item.targetId;
        return (
          <ItemRow
            key={item.id}
            icon={getTypeIcon(item.targetType)}
            typeLabel={t.types[item.targetType]}
            typeColor={getTypeColor(item.targetType)}
            title={item.title}
            href={buildHref(item.targetType, rawId)}
            meta={new Date(item.createdAt).toLocaleDateString(
              locale === "en" ? "en-US" : "zh-CN",
              { year: "numeric", month: "short", day: "numeric" }
            )}
            ctaLabel={t.viewItem}
          />
        );
      })}
    </div>
  );
}

// ── History tab ───��──────────────────────────────────────────────────────────

function HistoryTab({ t }: { t: I18nText }) {
  const locale = useLocale();
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    function loadHistory() {
      try {
        const raw = localStorage.getItem(HISTORY_KEY);
        const parsed: HistoryItem[] = raw ? JSON.parse(raw) : [];
        setItems(parsed.slice(0, HISTORY_MAX));
      } catch {
        setItems([]);
      }
    }

    queueMicrotask(loadHistory);
  }, []);

  function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
    setItems([]);
  }

  if (items.length === 0) return <EmptyState text={t.emptyHistory} />;

  return (
    <div>
      <div className="mb-3 flex items-center justify-end">
        <button
          onClick={clearHistory}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] transition hover:border-red-500/40 hover:text-red-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {t.clearHistory}
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const rawId = extractRowId({ _id: item.targetId } as { _id: string }) ?? item.targetId;
          return (
            <ItemRow
              key={item.id}
              icon={getTypeIcon(item.targetType)}
              typeLabel={t.types[item.targetType]}
              typeColor={getTypeColor(item.targetType)}
              title={item.title}
              href={buildHref(item.targetType, rawId)}
              meta={formatRelativeTime(item.visitedAt, locale)}
              ctaLabel={t.viewItem}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── Public helper: record a page visit ───────────────────────────────────────

export function recordBrowseHistory(item: Omit<HistoryItem, "id" | "visitedAt">) {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const existing: HistoryItem[] = raw ? JSON.parse(raw) : [];
    // Remove duplicate
    const filtered = existing.filter(
      (h) => !(h.targetType === item.targetType && h.targetId === item.targetId)
    );
    const next: HistoryItem[] = [
      { ...item, id: `${item.targetType}:${item.targetId}`, visitedAt: Date.now() },
      ...filtered,
    ].slice(0, HISTORY_MAX);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

// ── Main section ─────────────────────────────────────────────────────────────

export default function LikesAndHistorySection({ userId }: LikesAndHistorySectionProps) {
  const locale = useLocale();
  const t = i18n[locale === "en" ? "en" : "zh"];

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
          <Heart className="h-4 w-4" />
          {t.likes}
        </h3>
        <LikesTab userId={userId} t={t} />
      </div>
      <hr className="my-6 border-[var(--color-border)]" />
      <div>
        <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {t.history}
        </h3>
        <HistoryTab t={t} />
      </div>
    </div>
  );
}
