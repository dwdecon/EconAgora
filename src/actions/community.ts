"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function getPosts({
  page = 1,
  tag,
}: {
  page?: number;
  tag?: string;
} = {}) {
  const pageSize = 20;
  const where: any = {};
  if (tag) where.tags = { has: tag };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.post.count({ where }),
  ]);

  // Count comments per post (polymorphic — no FK relation)
  const postsWithCounts = await Promise.all(
    posts.map(async (post) => ({
      ...post,
      _count: { comments: await prisma.comment.count({ where: { targetType: "POST", targetId: post.id } }) },
    }))
  );

  return { posts: postsWithCounts, total, pages: Math.ceil(total / pageSize) };
}

export async function createPost(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const post = await prisma.post.create({
    data: {
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      tags: (formData.get("tags") as string || "").split(",").map((t) => t.trim()).filter(Boolean),
      authorId: session.user.id,
    },
  });

  redirect(`/community/${post.id}`);
}
