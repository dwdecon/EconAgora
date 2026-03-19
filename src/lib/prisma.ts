import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    // Build time — no DB available, return a client that will fail at runtime
    return new PrismaClient({ adapter: new PrismaPg({ connectionString: "postgresql://placeholder:5432/placeholder" }) });
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
