import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PromptCard from "@/components/prompts/PromptCard";
import PostCard from "@/components/community/PostCard";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      prompts: {
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        take: 6,
      },
      posts: {
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          author: { select: { id: true, name: true, avatar: true } },
        },
      },
    },
  });
  if (!user) notFound();

  // Count comments per post (polymorphic — no FK relation)
  const postsWithCounts = await Promise.all(
    user.posts.map(async (post) => ({
      ...post,
      _count: { comments: await prisma.comment.count({ where: { targetType: "POST", targetId: post.id } }) },
    }))
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-16 w-16 rounded-full bg-dark-card border border-dark-border flex items-center justify-center text-2xl font-bold text-primary">
          {user.name[0]}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          {user.affiliation && <p className="text-sm text-gray-text">{user.affiliation}</p>}
          {user.bio && <p className="mt-1 text-sm text-gray-text">{user.bio}</p>}
        </div>
      </div>

      {user.prompts.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">发布的 Prompts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {user.prompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={{ ...prompt, author: { id: user.id, name: user.name, avatar: user.avatar } }}
              />
            ))}
          </div>
        </section>
      )}

      {postsWithCounts.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">社区帖子</h2>
          <div className="flex flex-col gap-3">
            {postsWithCounts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
