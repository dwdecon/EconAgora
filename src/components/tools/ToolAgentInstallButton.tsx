"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Check, ChevronDown, Copy } from "lucide-react";

const AGENT_OPTIONS = [
  "Claude Code",
  "Codex",
  "Gemini CLI",
  "Cline",
  "Cursor",
  "Windsurf",
] as const;

const i18n = {
  zh: {
    installTool: "安装工具至",
    agentLabel: "选择 Agent",
    copyInstallPrompt: "复制安装提示词",
    copiedInstallPrompt: "✔发送给你的Agent",
  },
  en: {
    installTool: "Install tool with",
    agentLabel: "Choose Agent",
    copyInstallPrompt: "Copy install prompt",
    copiedInstallPrompt: "Sent to your Agent",
  },
} as const;

interface ToolAgentInstallButtonProps {
  toolTitle: string;
  officialUrl: string | null;
  quickStart: string | null;
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

function buildInstallPrompt(
  toolTitle: string,
  agentName: string,
  officialUrl: string | null,
  quickStart: string | null,
) {
  const urlSection = officialUrl ? `\n\n官方地址：${officialUrl}` : "";
  const cmdSection = quickStart ? `\n\n官方安装/快速开始说明：\n${quickStart}` : "";

  return `请帮我安装并配置「${toolTitle}」这个工具。${urlSection}${cmdSection}

请按照 ${agentName} 的最佳实践完成安装与配置（MCP 服务器请配置到 ${agentName} 的 MCP 设置中），安装后简要介绍它的主要功能，并给一个经济学研究场景的使用示例。`;
}

export default function ToolAgentInstallButton({
  toolTitle,
  officialUrl,
  quickStart,
  locale,
}: ToolAgentInstallButtonProps) {
  const t = i18n[locale as keyof typeof i18n] || i18n.zh;
  const [selectedAgent, setSelectedAgent] = useState<string>(AGENT_OPTIONS[0]);
  const [copied, setCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  async function handleCopy() {
    const prompt = buildInstallPrompt(toolTitle, selectedAgent, officialUrl, quickStart);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(prompt);
      } else {
        fallbackCopyText(prompt);
      }
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      fallbackCopyText(prompt);
      setCopied(true);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 1800);
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 shadow-[var(--shadow-inset-button)]">
      <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
        <Bot className="h-4 w-4" />
        {t.installTool}
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
        onClick={handleCopy}
        className={`flex w-full items-center justify-center gap-2 rounded-[6px] border px-4 py-2.5 text-[15px] font-normal transition-colors ${
          copied
            ? "border-[var(--color-border-hover)] bg-[var(--color-text-primary)] text-[var(--color-bg)]"
            : "border-[var(--color-border-hover)] bg-[var(--color-bg-surface-strong)] text-[var(--color-text-primary)] hover:bg-[var(--color-text-primary)] hover:text-[var(--color-bg)]"
        }`}
      >
        {!copied && <Copy className="h-4 w-4" />}
        <span>{copied ? t.copiedInstallPrompt : t.copyInstallPrompt}</span>
      </button>
    </div>
  );
}
