"use client";

import { useTheme } from "next-themes";

interface FloatingStarProps {
  onClick: () => void;
}

export default function FloatingStar({ onClick }: FloatingStarProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 text-[32px] leading-none cursor-pointer select-none"
      style={{
        color: isDark ? "#fff" : "#000",
        animation: "star-breathe 3s ease-in-out infinite",
      }}
      aria-label="AI Assistant"
    >
      ✦
    </button>
  );
}
