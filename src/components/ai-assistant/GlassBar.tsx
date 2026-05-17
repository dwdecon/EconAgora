"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

type AssistantState = "idle" | "input" | "thinking" | "acting" | "error";

interface GlassBarProps {
  state: AssistantState;
  errorMsg: string | null;
  onSend: (command: string) => void;
  onRetry: () => void;
  onClose: () => void;
  onDismissError: () => void;
}

export default function GlassBar({
  state,
  errorMsg,
  onSend,
  onRetry,
  onClose,
  onDismissError,
}: GlassBarProps) {
  const t = useTranslations("aiAssistant");
  const { resolvedTheme } = useTheme();
  const [input, setInput] = useState("");
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoDismissRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

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

  return (
    <div
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[min(92%,520px)]"
      style={{ animation: "glass-slide-up 400ms cubic-bezier(0.34, 1.56, 0.64, 1)" }}
    >
      <div
        className="relative overflow-hidden rounded-[20px]"
        style={{
          background: isDark
            ? "linear-gradient(135deg, rgba(30,30,30,0.75), rgba(20,20,20,0.65), rgba(30,30,30,0.7))"
            : "linear-gradient(135deg, rgba(255,255,255,0.68), rgba(255,255,255,0.48), rgba(255,255,255,0.58))",
          border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(255,255,255,0.5)",
          boxShadow: isDark
            ? "0 4px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)"
            : "0 4px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6)",
          backdropFilter: "blur(40px) saturate(180%)",
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none rounded-t-[20px]"
          style={{
            background: isDark
              ? "linear-gradient(180deg, rgba(255,255,255,0.04), transparent)"
              : "linear-gradient(180deg, rgba(255,255,255,0.25), transparent)",
          }}
        />

        <div className="relative flex items-center gap-2.5 px-4 py-2.5">
          <span
            className="shrink-0 leading-none select-none"
            style={{
              fontSize: state === "thinking" || state === "acting" ? 18 : 16,
              color: isDark ? "#fff" : "#000",
              opacity: state === "input" ? 0.4 : state === "error" ? 0.6 : 1,
              ...starStyle,
            }}
          >
            ✦
          </span>

          {state === "input" && (
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("placeholder")}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.9)" }}
            />
          )}

          {(state === "thinking" || state === "acting") && (
            <div
              className="flex-1 text-sm flex items-center gap-0.5"
              style={{ color: isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.65)" }}
            >
              {t(state === "thinking" ? "thinking" : "acting")}
              <AnimatedDots isDark={isDark} />
            </div>
          )}

          {state === "error" && (
            <div className="flex-1 flex items-center gap-3">
              <span className="text-sm text-red-500">{errorMsg || t("error")}</span>
              <button
                onClick={onRetry}
                className="text-xs px-2.5 py-1 rounded-lg"
                style={{
                  background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                  color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)",
                  border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.06)",
                }}
              >
                {t("retry")}
              </button>
            </div>
          )}

          {state === "input" && (
            <button
              onClick={handleSubmit}
              className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: isDark ? "#fff" : "rgba(0,0,0,0.8)",
                boxShadow: isDark ? "0 2px 12px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.15)",
              }}
            >
              <span style={{ color: isDark ? "#1c1c1c" : "#fff", fontSize: 16 }}>↑</span>
            </button>
          )}

          {state !== "input" && (
            <button
              onClick={state === "error" ? onDismissError : onClose}
              className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.06)",
                color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)",
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

function AnimatedDots({ isDark }: { isDark: boolean }) {
  const color = isDark ? "#fff" : "#000";
  return (
    <span className="inline-flex gap-[2px] ml-0.5">
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
