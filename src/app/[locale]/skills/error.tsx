"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";

export default function SkillsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale();

  useEffect(() => {
    console.error("Skills page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
          {locale === "en" ? "Something went wrong" : "出错了"}
        </h2>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          {error.message ||
            (locale === "en"
              ? "An error occurred while loading skills."
              : "加载技能时发生错误。")}
        </p>
        <button
          onClick={reset}
          className="mt-4 px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-hover transition"
        >
          {locale === "en" ? "Try again" : "重试"}
        </button>
      </div>
    </div>
  );
}