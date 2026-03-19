import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { getComments } from "@/actions/comments";
import { hasLiked } from "@/actions/likes";
import CommentSection from "@/components/shared/CommentSection";
import LikeButton from "@/components/shared/LikeButton";
import TagBadge from "@/components/shared/TagBadge";

export default async function PromptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const prompt = await prisma.prompt.findUnique({
    where: { id },
    include: { author: { select: { id: true, name: true, avatar: true } } },
  });
  if (!prompt) notFound();

  const session = await auth();
  const comments = await getComments("PROMPT", id);
  const liked = await hasLiked("PROMPT", id);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <span className="font-mono text-xs text-primary">{prompt.category}</span>
      <h1 className="mt-2 text-3xl font-bold">{prompt.title}</h1>
      {prompt.description && (
        <p className="mt-3 text-gray-text">{prompt.description}</p>
      )}
      <div className="mt-3 flex items-center gap-3 text-sm text-gray-text">
        <span>{prompt.author.name}</span>
        <span>·</span>
        <span>{new Date(prompt.createdAt).toLocaleDateString()}</span>
        <span>·</span>
        <span>{prompt.downloadCount} downloads</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {prompt.tags.map((tag) => (
          <TagBadge key={tag} tag={tag} />
        ))}
      </div>

      <div className="mt-8 rounded-xl bg-dark-card border border-dark-border p-6">
        <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
          {prompt.content}
        </pre>
      </div>

      <div className="mt-6 flex gap-3">
        <LikeButton targetType="PROMPT" targetId={id} likeCount={prompt.likeCount} liked={liked} />
        <a
          href={`/api/prompts/${id}/download`}
          className="rounded-lg border border-dark-border px-3 py-1.5 text-sm text-gray-text hover:text-white transition"
        >
          下载 .txt
        </a>
      </div>

      <CommentSection
        targetType="PROMPT"
        targetId={id}
        comments={comments as any}
        isLoggedIn={!!session?.user}
      />
    </div>
  );
}
