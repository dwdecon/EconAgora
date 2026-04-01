import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env") });

import { serverDb } from "@/lib/rdb-server";

const categoryMap: Record<string, string> = {
  "Literature Review": "文献",
  "Data Analysis": "数据",
  "Paper Writing": "写作",
  "Peer Review": "评审",
  "Topic Selection": "选题",
  "Other": "其他",
  "论文写作": "写作",
  "文献综述": "文献",
  "数据分析": "数据",
  "学术写作": "写作",
  "学术投稿": "写作",
  "论文优化": "写作",
  "计量经济学": "数据",
  "回归分析": "数据",
  "面板数据": "数据",
};

async function migrateCategories() {
  console.log("Fetching all prompts...");

  const { data: prompts, error } = await serverDb
    .from("prompt")
    .select("_id, title, category")
    .execute();

  if (error) {
    console.error("Failed to fetch prompts:", error);
    return;
  }

  console.log(`Found ${prompts?.length || 0} prompts`);

  const titleMap: Record<string, string> = {
    "经济学文献综述助手": "文献",
    "计量经济学分析助手": "数据",
    "学术论文结构优化": "写作",
    "经济学期刊投稿指南": "写作",
  };

  for (const prompt of prompts || []) {
    const newCategory = titleMap[prompt.title] || categoryMap[prompt.category] || "其他";

    if (prompt.category !== newCategory) {
      console.log(`Updating ${prompt._id}: "${prompt.title}" -> "${newCategory}"`);

      const { error: updateError } = await serverDb
        .from("prompt")
        .update({ category: newCategory })
        .eq("_id", prompt._id)
        .execute();

      if (updateError) {
        console.error(`Failed to update ${prompt._id}:`, updateError);
      }
    }
  }

  console.log("Migration complete!");
}

migrateCategories().catch(console.error);
