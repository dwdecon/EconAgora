import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const prompt = await prisma.prompt.findUnique({ where: { id } });
  if (!prompt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.prompt.update({
    where: { id },
    data: { downloadCount: { increment: 1 } },
  });

  const filename = `${prompt.title.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, "_")}.txt`;
  return new NextResponse(prompt.content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
