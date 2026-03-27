import { Link } from "@/i18n/navigation";
import TagBadge from "@/components/shared/TagBadge";

interface PromptCardProps {
  prompt: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    tags: string[];
    likeCount: number;
    downloadCount: number;
    author: { id: string; name: string; avatar: string | null };
  };
}

export default function PromptCard({ prompt }: PromptCardProps) {
  return (
    <Link
      href={`/prompts/${prompt.id}`}
      className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 hover:border-primary/50 transition flex flex-col"
    >
      <span className="font-mono text-xs text-primary">{prompt.category}</span>
      <h3 className="mt-2 font-semibold group-hover:text-primary transition line-clamp-2">
        {prompt.title}
      </h3>
      {prompt.description && (
        <p className="mt-2 text-sm text-[var(--color-text-secondary)] line-clamp-2">{prompt.description}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-1">
        {prompt.tags.slice(0, 3).map((tag) => (
          <TagBadge key={tag} tag={tag} />
        ))}
      </div>
      <div className="mt-auto pt-4 flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
        <span>{prompt.author.name}</span>
        <span>♥ {prompt.likeCount} · ↓ {prompt.downloadCount}</span>
      </div>
    </Link>
  );
}
