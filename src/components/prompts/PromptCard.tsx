import { Link } from "@/i18n/navigation";
import { getCategoryTheme } from "@/lib/category-theme";
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
      className="group flex min-h-[200px] flex-col rounded-[12px] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 transition-colors hover:border-[var(--color-border-hover)] hover:shadow-[var(--shadow-focus)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-hover)]"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] ${getCategoryTheme(prompt.category)}`}
        >
          {prompt.category}
        </span>
      </div>
      <h3 className="mt-2 line-clamp-2 font-normal leading-[1.25] text-[var(--color-text-primary)] transition">
        {prompt.title}
      </h3>
      {prompt.description && (
        <p className="mt-2 line-clamp-2 text-sm text-[var(--color-text-secondary)]">{prompt.description}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-1">
        {prompt.tags.slice(0, 3).map((tag) => (
          <TagBadge key={tag} tag={tag} />
        ))}
      </div>
      <div className="mt-auto flex items-center justify-between pt-4 text-xs text-[var(--color-text-secondary)]">
        <span>{prompt.author.name}</span>
        <span>{prompt.likeCount} likes | {prompt.downloadCount} downloads</span>
      </div>
    </Link>
  );
}
