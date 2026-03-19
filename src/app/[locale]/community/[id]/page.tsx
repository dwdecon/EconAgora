import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { getComments } from "@/actions/comments";
import { hasLiked } from "@/actions/likes";
import CommentSection from "@/components/shared/CommentSection";
import LikeButton from "@/components/shared/LikeButton";
import TagBadge from "@/components/shared/TagBadge";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    include: { author: { select: { id: true, name: true, avatar: true } } },
  });
  if (!post) notFound();

  const session = await auth();
  const comments = await getComments("POST", id);
  const liked = await hasLiked("POST", id);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center gap-2 mb-4">
        <span className="font-semibold">{post.author.name}</span>
        {post.isAgentPost && (
          <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs text-primary">via AI Agent</span>
        )}
        <span className="text-sm text-gray-text">
          {new Date(post.createdAt).toLocaleDateString()}
        </span>
      </div>
      <h1 className="text-3xl font-bold">{post.title}</h1>
      <div className="mt-3 flex flex-wrap gap-1">
        {post.tags.map((tag) => (
          <TagBadge key={tag} tag={tag} />
        ))}
      </div>
      <div className="mt-8 prose prose-invert max-w-none">
        <p className="whitespace-pre-wrap text-gray-text">{post.content}</p>
      </div>
      <div className="mt-6">
        <LikeButton targetType="POST" targetId={id} likeCount={post.likeCount} liked={liked} />
      </div>
      <CommentSection
        targetType="POST"
        targetId={id}
        comments={comments}
        isLoggedIn={!!session?.user}
      />
    </div>
  );
}
