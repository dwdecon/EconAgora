"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getPrompts({
  page = 1,
  category,
  tag,
  search,
}: {
  page?: number;
  category?: string;
  tag?: string;
  search?: string;
} = {}) {
  const pageSize = 12;
  const where: any = { status: "PUBLISHED" };
  if (category) where.category = category;
  if (tag) where.tags = { has: tag };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [prompts, total] = await Promise.all([
    prisma.prompt.findMany({
      where,
      include: { author: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.prompt.count({ where }),
  ]);

  return { prompts, total, pages: Math.ceil(total / pageSize) };
}

export async function createPrompt(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const prompt = await prisma.prompt.create({
    data: {
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      description: formData.get("description") as string,
      category: formData.get("category") as string,
      tags: (formData.get("tags") as string).split(",").map((t) => t.trim()).filter(Boolean),
      authorId: session.user.id,
      status: "PUBLISHED",
    },
  });

  redirect(`/prompts/${prompt.id}`);
}

export async function downloadPrompt(id: string) {
  await prisma.prompt.update({
    where: { id },
    data: { downloadCount: { increment: 1 } },
  });
}
