"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { TargetType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function toggleLike(targetType: TargetType, targetId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await prisma.userLike.findUnique({
    where: {
      userId_targetType_targetId: {
        userId: session.user.id,
        targetType,
        targetId,
      },
    },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.userLike.delete({ where: { id: existing.id } }),
      targetType === "PROMPT"
        ? prisma.prompt.update({ where: { id: targetId }, data: { likeCount: { decrement: 1 } } })
        : prisma.post.update({ where: { id: targetId }, data: { likeCount: { decrement: 1 } } }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.userLike.create({
        data: { userId: session.user.id, targetType, targetId },
      }),
      targetType === "PROMPT"
        ? prisma.prompt.update({ where: { id: targetId }, data: { likeCount: { increment: 1 } } })
        : prisma.post.update({ where: { id: targetId }, data: { likeCount: { increment: 1 } } }),
    ]);
  }

  revalidatePath(`/prompts/${targetId}`);
  revalidatePath(`/community/${targetId}`);
}

export async function hasLiked(targetType: TargetType, targetId: string) {
  const session = await auth();
  if (!session?.user?.id) return false;
  const like = await prisma.userLike.findUnique({
    where: {
      userId_targetType_targetId: {
        userId: session.user.id,
        targetType,
        targetId,
      },
    },
  });
  return !!like;
}
