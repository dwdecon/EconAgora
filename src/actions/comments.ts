"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { TargetType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getComments(targetType: TargetType, targetId: string) {
  return prisma.comment.findMany({
    where: { targetType, targetId, parentId: null },
    include: {
      author: { select: { id: true, name: true, avatar: true } },
      replies: {
        include: {
          author: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createComment(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const targetType = formData.get("targetType") as TargetType;
  const targetId = formData.get("targetId") as string;

  await prisma.comment.create({
    data: {
      content: formData.get("content") as string,
      targetType,
      targetId,
      parentId: (formData.get("parentId") as string) || null,
      authorId: session.user.id,
    },
  });

  revalidatePath(`/prompts/${targetId}`);
  revalidatePath(`/community/${targetId}`);
}
