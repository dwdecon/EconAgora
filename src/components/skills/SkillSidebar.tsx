"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, ChevronDown, Copy, Eye } from "lucide-react";
import { getSessionUser, db } from "@/lib/cloudbase";
import LikeButton from "@/components/shared/LikeButton";
import TagBadge from "@/components/shared/TagBadge";
import type { Skill } from "@/lib/skills";
import { recordBrowseHistory } from "@/components/account/LikesAndHistorySection";

const AGENT_OPTIONS = [
  "Claude Code",
  "Codex",
  "Gemini CLI",
  "Cline",
  "VS Code",
  "Antigravity",
  "Cursor",
  "Windsurf",
  "GitHub Copilot",
  "RooCode",
  "Kiro",
  "Trae",
  "Qwen Code",
  "Aider",
  "OpenCode",
];

const i18n = {
  zh: {
    about: "关于",
    stats: "统计",
    lastUpdated: "最后更新",
    category: "分类",
    tags: "标签",
    workflowStage: "工作流阶段",
    sourceRepo: "源仓库",
    platform: "适用平台",
    importSkill: "导入 Skills 至",
    agentLabel: "选择 Agent",
    copyImportPrompt: "复制导入提示词",
    copiedImportPrompt: "✔发送给你的Agent",
    views: "观看",
    likes: "点赞",
  },
  en: {
    about: "About",
    stats: "Statistics",
    lastUpdated: "Last updated",
    category: "Category",
    tags: "Tags",
    workflowStage: "Workflow Stage",
    sourceRepo: "Source Repository",
    platform: "Platform",
    importSkill: "Import Skills to",
    agentLabel: "Choose Agent",
    copyImportPrompt: "Copy import prompt",
    copiedImportPrompt: "Sent to your Agent",
    views: "Views",
    likes: "Likes",
  },
} as const;

interface SkillSidebarProps {
  skill: Skill;
  locale: string;
}

function fallbackCopyText(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function getSkillDownloadUrl(skill: Skill): string | null {
  if (skill.sourceUrl) return skill.sourceUrl;
  if (
    skill.sourceRepo === "meleantonio/awesome-econ-ai-stuff" &&
    skill.repoFolder &&
    skill.sourceSlug
  ) {
    return `https://raw.githubusercontent.com/${skill.sourceRepo}/main/_skills/${encodeURIComponent(skill.repoFolder)}/${encodeURIComponent(skill.sourceSlug)}`;
  }
  return null;
}

function buildAgentImportPrompt(skill: Skill, agentName: string, downloadUrl: string) {
  const repoUrl = skill.sourceRepo ? `https://github.com/${skill.sourceRepo}` : downloadUrl;

  return `请安装「${skill.title}」。

源仓库地址：${repoUrl}

请按照 ${agentName} 的最佳实践规范安装这个 skill，简要介绍它的用途，并给一段使用示例。`;
}

export default function SkillSidebar({ skill, locale }: SkillSidebarProps) {
  const t = i18n[locale as keyof typeof i18n] || i18n.zh;
  const [liked, setLiked] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(AGENT_OPTIONS[0]);
  const [copied, setCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const viewTracked = useRef(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchLikeStatus() {
      const sessionUser = await getSessionUser();
      if (cancelled) return;

      if (sessionUser) {
        const { data } = await db
          .from("user_like")
          .select("_id")
          .eq("user_id", sessionUser.id)
          .eq("target_type", "SKILL")
          .eq("target_id", skill.id)
          .single();

        if (!cancelled) setLiked(Boolean(data));
      }
    }

    fetchLikeStatus();
    return () => {
      cancelled = true;
    };
  }, [skill.id]);

  useEffect(() => {
    recordBrowseHistory({
      targetType: "SKILL",
      targetId: skill.id,
      title: skill.title,
      category: skill.category,
    });
  }, [skill.id, skill.title, skill.category]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  useEffect(() => {
    if (viewTracked.current) return;
    viewTracked.current = true;
    fetch(`/api/skills/${skill.id}/view`, { method: "POST" }).catch(() => {});
  }, [skill.id]);

  const downloadUrl = getSkillDownloadUrl(skill);

  async function handleCopyImportPrompt() {
    if (!downloadUrl) return;

    const prompt = buildAgentImportPrompt(skill, selectedAgent, downloadUrl);
    const markCopied = () => {
      setCopied(true);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 1800);
    };

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(prompt);
      } else {
        fallbackCopyText(prompt);
      }

      markCopied();
    } catch (error) {
      console.error("Failed to copy skill import prompt:", error);
      fallbackCopyText(prompt);
      markCopied();
    }
  }

  const formattedDate = new Date(skill.createdAt).toLocaleDateString(
    locale === "en" ? "en-US" : "zh-CN",
    { year: "numeric", month: "short", day: "numeric" },
  );

  return (
    <aside className="flex w-full flex-col gap-4 lg:w-64 lg:shrink-0 lg:self-start lg:sticky lg:top-24">
      {/* Agent import prompt */}
      {downloadUrl && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 shadow-[var(--shadow-inset-button)]">
          <label
            className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]"
          >
            <Bot className="h-4 w-4" />
            {t.importSkill}
          </label>
          <div ref={dropdownRef} className="relative mb-2">
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              aria-label={t.agentLabel}
              className="flex w-full items-center justify-between rounded-full border border-[var(--color-border)] bg-transparent px-4 py-2.5 text-[14px] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-card)] hover:text-[var(--color-text-primary)]"
            >
              <span>{selectedAgent}</span>
              <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {dropdownOpen && (
              <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] py-1 shadow-lg">
                {AGENT_OPTIONS.map((agent) => {
                  const isActive = agent === selectedAgent;
                  return (
                    <li key={agent}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAgent(agent);
                          setCopied(false);
                          setDropdownOpen(false);
                        }}
                        className={`flex w-full items-center rounded-full border px-4 py-2 text-[13px] transition-colors ${
                          isActive
                            ? "border-[var(--color-text-primary)] bg-[var(--color-text-primary)] font-medium text-[var(--color-bg)] shadow-[var(--shadow-inset-button)]"
                            : "border-transparent bg-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-card)] hover:text-[var(--color-text-primary)]"
                        }`}
                      >
                        {agent}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <button
            type="button"
            onClick={handleCopyImportPrompt}
            className={`flex w-full items-center justify-center gap-2 rounded-[6px] border px-4 py-2.5 text-[15px] font-normal transition-colors ${
              copied
                ? "border-[var(--color-border-hover)] bg-[var(--color-text-primary)] text-[var(--color-bg)]"
                : "border-[var(--color-border-hover)] bg-[var(--color-bg-surface-strong)] text-[var(--color-text-primary)] hover:bg-[var(--color-text-primary)] hover:text-[var(--color-bg)]"
            }`}
          >
            {!copied && <Copy className="h-4 w-4" />}
            <span>{copied ? t.copiedImportPrompt : t.copyImportPrompt}</span>
          </button>
        </div>
      )}

      {/* About card */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
        <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
          {t.about}
        </h3>
        <dl className="flex flex-col gap-3 text-sm">
          {locale === "zh" && skill.titleZh && (
            <div>
              <dt className="mb-1 text-xs text-[var(--color-text-secondary)]">
                中文名称
              </dt>
              <dd className="text-[var(--color-text-primary)]">{skill.titleZh}</dd>
            </div>
          )}
          <div>
            <dt className="mb-1 text-xs text-[var(--color-text-secondary)]">
              {t.lastUpdated}
            </dt>
            <dd className="text-[var(--color-text-primary)]">{formattedDate}</dd>
          </div>
          <div>
            <dt className="mb-1 text-xs text-[var(--color-text-secondary)]">
              {t.category}
            </dt>
            <dd className="font-mono text-xs text-primary">{skill.category}</dd>
          </div>
          {skill.tags.length > 0 && (
            <div>
              <dt className="mb-1 text-xs text-[var(--color-text-secondary)]">
                {t.tags}
              </dt>
              <dd className="flex flex-wrap gap-1">
                {skill.tags.map((tag) => (
                  <TagBadge key={tag} tag={tag} />
                ))}
              </dd>
            </div>
          )}
          {skill.workflowStage && (
            <div>
              <dt className="mb-1 text-xs text-[var(--color-text-secondary)]">
                {t.workflowStage}
              </dt>
              <dd className="text-[var(--color-text-primary)]">{skill.workflowStage}</dd>
            </div>
          )}
          {skill.sourceRepo && (
            <div>
              <dt className="mb-1 text-xs text-[var(--color-text-secondary)]">
                {t.sourceRepo}
              </dt>
              <dd>
                <a
                  href={`https://github.com/${skill.sourceRepo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-primary underline underline-offset-2 transition-opacity hover:opacity-80"
                >
                  {skill.sourceRepo}
                </a>
              </dd>
            </div>
          )}
          {skill.platform && (
            <div>
              <dt className="mb-1 text-xs text-[var(--color-text-secondary)]">
                {t.platform}
              </dt>
              <dd className="flex flex-wrap gap-1">
                {skill.platform.split(",").map((p) => (
                  <span
                    key={p.trim()}
                    className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-2 py-0.5 text-xs font-medium text-[var(--color-text-secondary)]"
                  >
                    {p.trim()}
                  </span>
                ))}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Stats card */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
        <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
          {t.stats}
        </h3>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <Eye className="h-4 w-4 shrink-0" />
            <span>{t.views}</span>
            <span className="ml-auto font-medium text-[var(--color-text-primary)]">
              {(skill.viewCount ?? 0).toLocaleString()}
            </span>
          </div>
          <LikeButton
            targetType="SKILL"
            targetId={skill.id}
            likeCount={skill.likeCount}
            liked={liked}
            variant="star"
          />
        </div>
      </div>
    </aside>
  );
}
