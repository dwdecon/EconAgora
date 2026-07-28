const envId = process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID || "";
const accessKey = process.env.CLOUDBASE_ACCESS_KEY || "";

if (!envId || !accessKey) {
  console.error("Missing CloudBase environment variables");
  process.exit(1);
}

const baseUrl = `https://${envId}.api.tcloudbasegateway.com/v1/rdb/rest`;

class RdbClient {
  constructor(table) {
    this.table = table;
    this.filters = [];
  }

  eq(column, value) {
    this.filters.push({ column, value });
    return this;
  }

  select(columns) {
    this.selectColumns = columns;
    return this;
  }

  async single() {
    const url = new URL(`${baseUrl}/${this.table}`);
    if (this.selectColumns) url.searchParams.set("select", this.selectColumns);
    for (const f of this.filters) {
      url.searchParams.set(`${f.column}`, `eq.${f.value}`);
    }
    url.searchParams.set("limit", "1");

    const response = await fetch(url.toString(), {
      headers: { "Authorization": `Bearer ${accessKey}` },
    });
    if (!response.ok) throw new Error(`GET ${response.status}: ${await response.text()}`);
    const data = await response.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  }

  async insert(values) {
    const url = `${baseUrl}/${this.table}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }
    return { success: true };
  }
}

function db(table) {
  return new RdbClient(table);
}

async function exists(table, id) {
  try {
    const row = await db(table).select("_id").eq("_id", id).single();
    return !!row;
  } catch (error) {
    console.error(`  检查 ${table}.${id} 失败:`, error.message);
    return false;
  }
}

async function insertTools(tools) {
  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const tool of tools) {
    const id = tool._id || tool.source_repo;
    try {
      if (await exists("tool", id)) {
        console.log(`⏭  已存在 (tool): ${tool.title} (${id})`);
        skipped++;
        continue;
      }
      const payload = {
        _id: id,
        title: tool.title,
        description: tool.description,
        category: tool.category,
        subcategory: tool.subcategory,
        tags: tool.tags && tool.tags.length ? JSON.stringify(tool.tags) : null,
        official_url: tool.source_url || `https://github.com/${tool.source_repo}`,
        status: tool.status || "PUBLISHED",
        author_id: tool.author_id || "system",
        view_count: 0,
        like_count: 0,
      };
      await db("tool").insert(payload);
      console.log(`✅ 已插入 (tool): ${tool.title} (${id})`);
      success++;
    } catch (error) {
      console.error(`❌ 失败 (tool) ${tool.title} (${id}):`, error.message);
      failed++;
    }
  }

  console.log(`\n[tool] 成功: ${success}, 跳过: ${skipped}, 失败: ${failed}`);
  return { success, skipped, failed };
}

async function insertSkills(skills) {
  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const skill of skills) {
    const id = skill._id || skill.source_slug;
    try {
      if (await exists("skill", id)) {
        console.log(`⏭  已存在 (skill): ${skill.title} (${id})`);
        skipped++;
        continue;
      }
      const payload = {
        _id: id,
        title: skill.title,
        title_zh: skill.title_zh || null,
        description: skill.description,
        description_zh: skill.description_zh || null,
        category: skill.category,
        subcategory: skill.subcategory,
        tags: skill.tags && skill.tags.length ? (Array.isArray(skill.tags) ? skill.tags.join(",") : skill.tags) : null,
        workflow_stage: skill.workflow_stage || null,
        platform: skill.platform || "claude-code,cursor,codex",
        skill_md: skill.skill_md || `# ${skill.title}\n\n## Purpose\n\n${skill.description}\n\n## Instructions\n\n（待补充）`,
        code_examples: skill.code_examples || null,
        tutorial: skill.tutorial || null,
        use_cases: skill.use_cases || null,
        source_repo: skill.source_repo || null,
        source_slug: skill.source_slug || id,
        repo_folder: skill.repo_folder || null,
        status: skill.status || "PUBLISHED",
        author_id: skill.author_id || "system",
        view_count: 0,
        like_count: 0,
      };
      await db("skill").insert(payload);
      console.log(`✅ 已插入 (skill): ${skill.title} (${id})`);
      success++;
    } catch (error) {
      console.error(`❌ 失败 (skill) ${skill.title} (${id}):`, error.message);
      failed++;
    }
  }

  console.log(`\n[skill] 成功: ${success}, 跳过: ${skipped}, 失败: ${failed}`);
  return { success, skipped, failed };
}

async function main() {
  const tools = require("./new-tools.json");
  const skills = require("./new-skills.json");

  console.log(`准备插入 ${tools.length} 个工具，${skills.length} 个技能...\n`);

  const toolResult = await insertTools(tools);
  const skillResult = await insertSkills(skills);

  console.log(`\n总计：工具 ${toolResult.success} 新 / ${toolResult.skipped} 跳过 / ${toolResult.failed} 失败；技能 ${skillResult.success} 新 / ${skillResult.skipped} 跳过 / ${skillResult.failed} 失败`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
