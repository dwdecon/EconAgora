"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

interface CreateNewCardProps {
  href: string;
  title: string;
  description: string;
}

export default function CreateNewCard({
  href,
  title,
  description,
}: CreateNewCardProps) {
  return (
    <Link
      href={href}
      className="group flex min-h-[300px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[var(--color-border)] p-6 text-center transition-colors hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-surface)]"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-bg-surface-strong)] text-[var(--color-text-primary)] transition-colors group-hover:bg-[var(--color-text-primary)] group-hover:text-[var(--color-bg)] shadow-[var(--shadow-inset-button)]">
        <Plus className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-medium text-[var(--color-text-primary)]">
        {title}
      </h3>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
        {description}
      </p>
    </Link>
  );
}