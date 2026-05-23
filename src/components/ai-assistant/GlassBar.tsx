"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import type { ActivityInfo } from "./usePageAgent";
import { useMounted } from "@/hooks/useMounted";

type AssistantState = "idle" | "input" | "thinking" | "acting" | "done" | "error";

interface GlassBarProps {
  state: AssistantState;
  errorMsg: string | null;
  activity: ActivityInfo;
  activityHistory: ActivityInfo[];
  onSend: (command: string) => void;
  onRetry: () => void;
  onClose: () => void;
  onStop: () => void;
  onDismissError: () => void;
  onNewConversation: () => void;
}

export default function GlassBar({
  state,
  errorMsg,
  activity,
  activityHistory,
  onSend,
  onRetry,
  onClose,
  onStop,
  onDismissError,
  onNewConversation,
}: GlassBarProps) {
  const t = useTranslations("aiAssistant");
  const { resolvedTheme } = useTheme();
  const [input, setInput] = useState("");
  const mounted = useMounted();
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoDismissRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollSentinelRef = useRef<HTMLDivElement>(null);

  const isDark = resolvedTheme === "dark";
  const theme = getThemeStyles(isDark);

  useEffect(() => {
    if (state === "input") {
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [state]);

  useEffect(() => {
    if (state === "error") {
      autoDismissRef.current = setTimeout(onDismissError, 8000);
      return () => clearTimeout(autoDismissRef.current);
    }
  }, [state, onDismissError]);

  // Collapse panel when returning to input
  useEffect(() => {
    if (state === "input" || state === "idle") {
      setExpanded(false);
    }
    if (state === "done") {
      setExpanded(true);
    }
  }, [state]);

  // Click outside to close in input state
  useEffect(() => {
    if (state !== "input") return;

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [state, onClose]);

  // Auto-scroll thinking panel to bottom on new activity
  useEffect(() => {
    if (expanded && scrollSentinelRef.current) {
      scrollSentinelRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [expanded, activityHistory]);

  if (!mounted) return null;

  const handleSubmit = () => {
    const cmd = input.trim();
    if (!cmd) return;
    setInput("");
    onSend(cmd);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  const starStyle: React.CSSProperties =
    state === "thinking"
      ? { animation: "star-spin 3s linear infinite" }
      : state === "acting"
        ? { animation: "star-pulse 1.2s ease-in-out infinite" }
        : {};

  const isWorking = state === "thinking" || state === "acting";
  const showPanel = isWorking || state === "done";
  const statusText = isWorking
    ? activity.summary || t(state === "thinking" ? "thinking" : "acting")
    : null;

  return (
    <div
      ref={containerRef}
      className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[min(92%,520px)]"
      style={{ zIndex: 2147483647, animation: "glass-slide-up 400ms cubic-bezier(0.34, 1.56, 0.64, 1)" }}
    >
      {/* Expanded thinking panel */}
      {expanded && showPanel && (
        <div
          className="mb-2 overflow-hidden rounded-[16px] px-4 py-3"
          style={{
            maxHeight: 180,
            overflowY: "auto",
            background: theme.panelBg,
            border: theme.panelBorder,
            boxShadow: theme.panelShadow,
            backdropFilter: "blur(40px) saturate(180%)",
            animation: "tissue-pull-out 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
            transformOrigin: "bottom center",
          }}
        >
          {activityHistory.length === 0 ? (
            <p
              className="text-sm leading-relaxed"
              style={{ color: theme.statusColor }}
            >
              {t("thinking")}…
            </p>
          ) : (
            <div className="space-y-2">
              {activityHistory.map((item, idx) => {
                const isLast = idx === activityHistory.length - 1;
                return (
                  <div
                    key={idx}
                    style={{ opacity: isLast ? 1 : 0.55 }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-xs font-semibold"
                        style={{ color: theme.labelColor }}
                      >
                        {t("step")} {item.step || idx + 1}
                      </span>
                      {item.tool && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-md font-medium"
                          style={{
                            background: theme.toolBadgeBg,
                            color: theme.toolBadgeColor,
                          }}
                        >
                          {item.tool.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: theme.statusColor }}
                    >
                      {item.summary}
                    </p>
                  </div>
                );
              })}
              <div ref={scrollSentinelRef} />
            </div>
          )}
        </div>
      )}

      {/* Main bar */}
      <div
        className="relative rounded-[20px] cursor-default"
        style={{
          background: theme.barBg,
          border: theme.barBorder,
          boxShadow: theme.barShadow,
          backdropFilter: "blur(40px) saturate(180%)",
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none rounded-t-[20px]"
          style={{
            background: theme.barHighlight,
          }}
        />

        <div className="relative flex items-center gap-2.5 px-4 py-2.5">
          {/* Star icon */}
          <span
            className="shrink-0 leading-none select-none cursor-pointer"
            style={{
              fontSize: state === "thinking" || state === "acting" ? 18 : 16,
              color: theme.dotColor,
              opacity: state === "input" ? 0.4 : state === "error" ? 0.6 : 1,
              ...starStyle,
            }}
            onClick={isWorking ? () => setExpanded((e) => !e) : undefined}
          >
            ✦
          </span>

          {/* Input state */}
          {state === "input" && (
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("placeholder")}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: theme.inputColor }}
            />
          )}

          {/* Thinking / Acting state — clickable area to expand */}
          {isWorking && (
            <div
              className="flex-1 flex items-center justify-between min-w-0 gap-2 cursor-pointer rounded-lg px-1 -py-0.5"
              onClick={() => setExpanded((e) => !e)}
            >
              <div
                className="flex-1 text-sm flex items-center gap-1 min-w-0 truncate"
                style={{ color: theme.statusColor }}
              >
                <span className="truncate">
                  {statusText}
                </span>
                <AnimatedDots color={theme.dotColor} />
              </div>

              {activity.step > 0 && (
                <span
                  className="shrink-0 text-xs tabular-nums font-medium"
                  style={{ color: theme.stepColor }}
                >
                  #{activity.step}
                </span>
              )}
            </div>
          )}

          {/* Done state — show completion and "+" for new conversation */}
          {state === "done" && (
            <div
              className="flex-1 flex items-center gap-2 cursor-pointer rounded-lg px-1"
              onClick={() => setExpanded((e) => !e)}
            >
              <span
                className="text-sm"
                style={{ color: theme.statusColor }}
              >
                ✓ {t("done")}
              </span>
            </div>
          )}

          {/* Error state */}
          {state === "error" && (
            <div className="flex-1 flex items-center gap-3">
              <span className="text-sm text-red-500">{errorMsg || t("error")}</span>
              <button
                onClick={onRetry}
                className="text-xs px-2.5 py-1 rounded-lg"
                style={{
                  background: theme.toolBadgeBg,
                  color: theme.retryBtnColor,
                  border: theme.panelBorder,
                }}
              >
                {t("retry")}
              </button>
            </div>
          )}

          {/* Send button (input state) */}
          {state === "input" && (
            <button
              onClick={handleSubmit}
              className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: theme.sendBtnBg,
                boxShadow: theme.sendBtnShadow,
              }}
            >
              <span style={{ color: theme.sendBtnIconColor, fontSize: 16 }}>↑</span>
            </button>
          )}

          {/* New conversation button (done state) */}
          {state === "done" && (
            <button
              onClick={onNewConversation}
              className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: theme.sendBtnBg,
                boxShadow: theme.sendBtnShadow,
              }}
            >
              <span style={{ color: theme.sendBtnIconColor, fontSize: 18, fontWeight: 300 }}>+</span>
            </button>
          )}

          {/* Stop button (thinking/acting state) */}
          {isWorking && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStop();
              }}
              className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-opacity hover:opacity-80"
              style={{
                background: theme.stopBtnBg,
                border: theme.stopBtnBorder,
                color: theme.stopBtnColor,
                fontSize: 14,
              }}
            >
              ■
            </button>
          )}

          {/* Close/dismiss button (non-input, non-working, non-done) */}
          {!isWorking && state !== "input" && state !== "done" && (
            <button
              onClick={state === "error" ? onDismissError : onClose}
              className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: theme.closeBtnBg,
                border: theme.closeBtnBorder,
                color: theme.closeBtnColor,
                fontSize: 12,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AnimatedDots({ color }: { color: string }) {
  return (
    <span className="inline-flex gap-[2px] ml-0.5 shrink-0">
      {[0, 0.2, 0.4].map((delay) => (
        <span
          key={delay}
          style={{
            width: 4,
            height: 4,
            borderRadius: "50%",
            backgroundColor: color,
            animation: `dot-fade 1.4s ease-in-out ${delay}s infinite`,
          }}
        />
      ))}
    </span>
  );
}

function getThemeStyles(isDark: boolean) {
  return {
    barBg: isDark
      ? "linear-gradient(135deg, rgba(30,30,30,0.75), rgba(20,20,20,0.65), rgba(30,30,30,0.7))"
      : "linear-gradient(135deg, rgba(255,255,255,0.68), rgba(255,255,255,0.48), rgba(255,255,255,0.58))",
    barBorder: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(255,255,255,0.5)",
    barShadow: isDark
      ? "0 4px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)"
      : "0 4px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6)",
    barHighlight: isDark
      ? "linear-gradient(180deg, rgba(255,255,255,0.04), transparent)"
      : "linear-gradient(180deg, rgba(255,255,255,0.25), transparent)",
    inputColor: isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.9)",
    panelBg: isDark
      ? "linear-gradient(135deg, rgba(30,30,30,0.9), rgba(20,20,20,0.8))"
      : "linear-gradient(135deg, rgba(255,255,255,0.82), rgba(255,255,255,0.62))",
    panelBorder: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.08)",
    panelShadow: isDark ? "0 4px 24px rgba(0,0,0,0.3)" : "0 4px 24px rgba(0,0,0,0.06)",
    labelColor: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)",
    toolBadgeBg: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
    toolBadgeColor: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)",
    statusColor: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)",
    stepColor: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)",
    closeBtnBg: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
    closeBtnBorder: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.06)",
    closeBtnColor: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)",
    stopBtnBg: isDark ? "rgba(255,80,80,0.15)" : "rgba(220,50,50,0.1)",
    stopBtnBorder: isDark ? "1px solid rgba(255,80,80,0.2)" : "1px solid rgba(220,50,50,0.15)",
    stopBtnColor: isDark ? "rgba(255,100,100,0.8)" : "rgba(200,50,50,0.7)",
    sendBtnBg: isDark ? "#fff" : "rgba(0,0,0,0.8)",
    sendBtnShadow: isDark ? "0 2px 12px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.15)",
    sendBtnIconColor: isDark ? "#1c1c1c" : "#fff",
    dotColor: isDark ? "#fff" : "#000",
    retryBtnColor: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)",
  };
}
