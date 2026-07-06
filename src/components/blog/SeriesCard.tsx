"use client";

import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";

interface SeriesCardProps {
  id: string;
  name: string;
  nameEn?: string;
  description: string;
  descriptionEn?: string;
  updateFrequency: string;
  updateFrequencyEn?: string;
  cover?: string;
  color?: string;
  locale: string;
}

export default function SeriesCard({
  id,
  name,
  nameEn,
  description,
  descriptionEn,
  updateFrequency,
  updateFrequencyEn,
  cover,
  color,
  locale,
}: SeriesCardProps) {
  const isEn = locale === "en";
  const displayName = isEn ? nameEn || name : name;
  const displayDescription = isEn ? descriptionEn || description : description;
  const displayFrequency = isEn ? updateFrequencyEn || updateFrequency : updateFrequency;

  return (
    <Link
      href={`/series/${id}`}
      className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-[var(--color-border)] bg-[var(--color-bg-card)] transition-all duration-300 hover:border-[var(--color-border-hover)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
    >
      <div
        className="relative h-44 w-full overflow-hidden"
        style={{
          background: color
            ? `linear-gradient(135deg, ${color}26 0%, ${color}0d 100%)`
            : "var(--color-bg-surface)",
        }}
      >
        {cover ? (
          <img
            src={cover}
            alt={displayName}
            className="h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-[14px] text-[var(--color-text-muted)]">{ displayName }</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h2 className="text-[22px] font-semibold leading-[1.2] tracking-[-0.02em] text-[var(--color-text-primary)] transition group-hover:text-[var(--color-primary)]">
          {displayName}
        </h2>
        <p className="mt-3 flex-1 text-[15px] leading-[1.65] text-[var(--color-text-secondary)]">
          {displayDescription}
        </p>
        <div className="mt-6 flex items-center justify-between">
          <span className="text-[13px] text-[var(--color-text-muted)]">{displayFrequency}</span>
          <span className="inline-flex items-center gap-1 text-[14px] font-medium text-[var(--color-primary)] transition group-hover:gap-2">
            {isEn ? "View series" : "查看系列"}
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
