"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

interface FloatingStarProps {
  onClick: () => void;
}

export default function FloatingStar({ onClick }: FloatingStarProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show bubble every 10 seconds
  useEffect(() => {
    if (!mounted) return;

    // First appearance after 5s
    const initialTimer = setTimeout(() => {
      setShowBubble(true);
      hideTimerRef.current = setTimeout(() => setShowBubble(false), 4000);
    }, 5000);

    intervalRef.current = setInterval(() => {
      setShowBubble(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setShowBubble(false), 4000);
    }, 10000);

    return () => {
      clearTimeout(initialTimer);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div className="fixed bottom-8 right-12 flex items-end gap-3" style={{ zIndex: 2147483647 }}>
      {/* Speech bubble */}
      {showBubble && (
        <div
          className="relative mb-1.5 px-3.5 py-2 rounded-2xl text-sm whitespace-nowrap"
          style={{
            background: isDark
              ? "linear-gradient(135deg, rgba(30,30,30,0.9), rgba(20,20,20,0.85))"
              : "linear-gradient(135deg, rgba(255,255,255,0.92), rgba(255,255,255,0.82))",
            border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.06)",
            boxShadow: isDark
              ? "0 4px 20px rgba(0,0,0,0.3)"
              : "0 4px 20px rgba(0,0,0,0.08)",
            backdropFilter: "blur(20px)",
            color: isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.7)",
            animation: "bubble-pop 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          找不到想要的？试试我吧~
          {/* Arrow pointing right */}
          <span
            className="absolute -right-1.5 bottom-3 w-3 h-3 rotate-45"
            style={{
              background: isDark
                ? "rgba(25,25,25,0.9)"
                : "rgba(255,255,255,0.92)",
              border: isDark
                ? "1px solid rgba(255,255,255,0.1)"
                : "1px solid rgba(0,0,0,0.06)",
              borderLeft: "none",
              borderBottom: "none",
            }}
          />
        </div>
      )}

      {/* Star button */}
      <button
        onClick={onClick}
        className="leading-none cursor-pointer select-none transition-transform hover:scale-110 active:scale-95"
        style={{
          fontSize: 40,
          color: isDark ? "#fff" : "#000",
          animation: "star-breathe 3s ease-in-out infinite",
        }}
        aria-label="AI Assistant"
      >
        ✦
      </button>
    </div>
  );
}
