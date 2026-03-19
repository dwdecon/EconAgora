import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcryptjs from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcryptjs.hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@ai4econ.com" },
    update: {},
    create: {
      email: "admin@ai4econ.com",
      name: "AI4Econ Admin",
      password,
      role: "ADMIN",
    },
  });

  const user = await prisma.user.upsert({
    where: { email: "researcher@example.com" },
    update: {},
    create: {
      email: "researcher@example.com",
      name: "张研究员",
      password,
      affiliation: "北京大学经济学院",
      bio: "专注于宏观经济学与 AI 应用研究",
    },
  });

  // Seed prompts
  const promptData = [
    { title: "文献综述助手", content: "你是一位经济学文献综述专家...", category: "文献综述", tags: ["综述", "文献"], description: "帮助快速生成结构化的文献综述" },
    { title: "Stata 数据清洗", content: "你是一位 Stata 数据处理专家...", category: "数据分析", tags: ["Stata", "数据清洗"], description: "指导 Stata 数据清洗流程" },
    { title: "论文摘要润色", content: "你是一位学术写作专家...", category: "论文写作", tags: ["摘要", "润色"], description: "帮助润色英文论文摘要" },
    { title: "DID 方法论解释", content: "你是一位计量经济学专家...", category: "数据分析", tags: ["DID", "因果推断"], description: "解释双重差分法的原理与应用" },
    { title: "审稿意见回复模板", content: "你是一位期刊审稿回复专家...", category: "审稿回复", tags: ["审稿", "回复"], description: "生成结构化的审稿意见回复" },
  ];

  for (const p of promptData) {
    await prisma.prompt.create({
      data: { ...p, authorId: user.id, status: "PUBLISHED" },
    });
  }

  // Seed posts
  await prisma.post.create({
    data: {
      title: "欢迎来到 AI4Econ 社区",
      content: "这是 AI4Econ 社区的第一帖。欢迎大家在这里交流 AI 在经济学研究中的应用经验。",
      authorId: admin.id,
      pinned: true,
      tags: ["公告"],
    },
  });

  await prisma.post.create({
    data: {
      title: "分享：用 Claude 做文献综述的经验",
      content: "最近尝试用 Claude 辅助文献综述，效果不错。分享一下我的工作流...",
      authorId: user.id,
      tags: ["经验分享", "Claude", "文献综述"],
    },
  });

  console.log("Seed data created successfully");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
