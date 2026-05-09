export default function TagBadge({ tag }: { tag: string }) {
  return (
    <span className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-secondary)]">
      {tag}
    </span>
  );
}
