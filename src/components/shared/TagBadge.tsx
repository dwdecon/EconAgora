export default function TagBadge({ tag }: { tag: string }) {
  return (
    <span className="rounded-full bg-[var(--color-bg-surface-strong)] px-2.5 py-0.5 text-xs text-[var(--color-text-secondary)]">
      {tag}
    </span>
  );
}
