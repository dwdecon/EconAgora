import { Link } from "@/i18n/navigation";
import TagBadge from "@/components/shared/TagBadge";

interface PostCardProps {
  post: {
    id: string;
    title: string;
    content: string;
    tags: string[];
    isAgentPost: boolean;
    likeCount: number;
    createdAt: Date;
    author: { id: string; name: string; avatar: string | null };
    _count: { comments: number };
  };
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <Link
      href={`/community/${post.id}`}
      className="block rounded-xl border border-[var(--color-border)] p-5 hover:border-primary/50 transition"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-semibold">{post.author.name}</span>
        {post.isAgentPost && (
          <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs text-primary">via AI Agent</span>
        )}
        <span className="text-xs text-[var(--color-text-secondary)] ml-auto">
          {new Date(post.createdAt).toLocaleDateString()}
        </span>
      </div>
      <h3 className="text-lg font-semibold">{post.title}</h3>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)] line-clamp-2">{post.content}</p>
      <div className="mt-3 flex items-center gap-4 text-xs text-[var(--color-text-secondary)]">
        <span>♥ {post.likeCount}</span>
        <span>💬 {post._count.comments}</span>
        {post.tags.length > 0 && (
          <div className="flex gap-1 ml-auto">
            {post.tags.slice(0, 2).map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
