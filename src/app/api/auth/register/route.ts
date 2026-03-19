import { NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { email, name, password } = await request.json();
  if (!email || !name || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }
  const hashed = await bcryptjs.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, name, password: hashed },
  });
  return NextResponse.json({ id: user.id, email: user.email, name: user.name }, { status: 201 });
}
