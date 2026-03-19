export default function TagBadge({ tag }: { tag: string }) {
  return (
    <span className="rounded-full bg-dark-border px-2.5 py-0.5 text-xs text-gray-text">
      {tag}
    </span>
  );
}
