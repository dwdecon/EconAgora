/* eslint-disable @typescript-eslint/no-unused-vars */
import { config } from "dotenv";
import { resolve } from "path";
import { serverDb } from "@/lib/rdb-server";
import { createId, toSqlTimestamp } from "@/lib/rdb-utils";
import { execSync } from "child_process";

config({ path: resolve(__dirname, "../.env") });

const categoryMap: Record<string, string> = {
  "写作": "写作",
  "评审": "评审",
  "选题": "选题",
  "文献": "文献",
  "数据": "数据",
  "其他": "其他",
};

// 字段名到列名的映射
const fieldToColumn: Record<string, string> = {
  "fldO5Icxpc": "日期",
  "fldph5aL5d": "标签",
  "fldgxAIoAJ": "提示词内容",
  "fldNd7y3eW": "AI+科研 Prompt 收集",
  "fldHPlOKHh": "主题",
  "fldPT7AUfj": "一句话简要描述",
  "fldeON7xhD": "作者",
};

function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;
  // 格式: "2026/3/25" -> "2026-03-25"
  return dateStr.replace(/\//g, '-').replace(/(\d{4})-(\d)-(\d)/, (_, y, m, d) => `${y}-0${m}-0${d}`).replace(/(\d{4})-(\d{2})-(\d)$/, (_, y, m, d) => `${y}-${m}-0${d}`).replace(/(\d{4})-(\d)-(\d{2})$/, (_, y, m, d) => `${y}-0${m}-${d}`);
}

async function importPrompts() {
  console.log("Fetching data from Feishu...");

  const result = execSync(
    'lark-cli base +record-list --base-token TZ2PbGf1maHCbms5Qbwc8LBZn9c --table-id tblXgxj2txeNCRjF --limit 100',
    { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
  );

  const response = JSON.parse(result);
  const allRows = response.data.data;
  const fieldIds = response.data.field_id_list; // 统一的字段顺序

  console.log(`Found ${allRows.length} rows`);

  const now = toSqlTimestamp();
  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < allRows.length; i++) {
    const row = allRows[i];

    // 跳过空行
    if (!row || !Array.isArray(row) || row.every(cell => cell === null)) {
      skipped++;
      continue;
    }

    // 根据 field_id_list 构建字段映射
    const fieldMap: Record<string, any> = {};
    for (let j = 0; j < fieldIds.length; j++) {
      fieldMap[fieldIds[j]] = row[j];
    }

    // 提取各字段
    const title = fieldMap["fldHPlOKHh"] ? String(fieldMap["fldHPlOKHh"]).trim() : ""; // 主题
    const description = fieldMap["fldPT7AUfj"] ? String(fieldMap["fldPT7AUfj"]) : ""; // 一句话简要描述
    const author = fieldMap["fldeON7xhD"] ? String(fieldMap["fldeON7xhD"]) : ""; // 作者
    const dateStr = fieldMap["fldO5Icxpc"] ? String(fieldMap["fldO5Icxpc"]) : ""; // 日期
    const rawCategory = fieldMap["fldph5aL5d"]; // 标签
    const content = fieldMap["fldgxAIoAJ"] ? String(fieldMap["fldgxAIoAJ"]).trim() : ""; // 提示词内容

    // 跳过没有标题或内容的行
    if (!title || !content) {
      skipped++;
      continue;
    }

    const sourceDate = parseDate(dateStr);
    const category = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory;
    const normalizedCategory = categoryMap[String(category)] || "其他";

    const promptId = createId("prompt");
    const payload = {
      _id: promptId,
      _openid: "feishu_import",
      title,
      content,
      description,
      category: normalizedCategory,
      tags: JSON.stringify(Array.isArray(rawCategory) ? rawCategory : []),
      locale: "zh",
      status: "PUBLISHED",
      author_id: "feishu_import",
      author_name: author,
      source_date: sourceDate,
      is_featured: 0,
      view_count: 0,
      like_count: 0,
      download_count: 0,
      created_at: now,
      updated_at: now,
    };

    const { error } = await serverDb.from("prompt").insert(payload).execute();

    if (error) {
      errors++;
      if (errors <= 5) {
        console.error(`Failed: "${title.substring(0, 30)}" - ${error.message}`);
      }
    } else {
      imported++;
      if (imported <= 3 || imported % 10 === 0) {
        console.log(`Imported ${imported}: ${title.substring(0, 30)}`);
      }
    }
  }

  console.log(`\nImport complete! Imported ${imported} prompts, skipped ${skipped}, errors ${errors}`);
}

importPrompts().catch(console.error);
