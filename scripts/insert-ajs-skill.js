/**
 * Idempotent insertion of the Awesome-Journal-Skills collection entry
 * into the `skill` table. Reuses the RdbClient from insert-research-assets.js.
 *
 * Usage:
 *   NEXT_PUBLIC_CLOUDBASE_ENV_ID=... CLOUDBASE_ACCESS_KEY=... node scripts/insert-ajs-skill.js
 */
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

function stripFrontmatter(md) {
  return md.replace(/^---\n[\s\S]*?\n---\n/, "");
}

async function main() {
  const skills = require("./ajs-skill.json");

  for (const skill of skills) {
    const id = skill._id || skill.source_slug;
    const exists = await new RdbClient("skill").select("_id").eq("_id", id).single();
    if (exists) {
      console.log(`⏭  已存在 (skill): ${skill.title} (${id})`);
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
      tags: skill.tags ? JSON.stringify(Array.isArray(skill.tags) ? skill.tags : skill.tags.split(",").map((t) => t.trim()).filter(Boolean)) : null,
      workflow_stage: skill.workflow_stage || null,
      platform: skill.platform || "claude-code,codex",
      skill_md: stripFrontmatter(skill.skill_md),
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

    await new RdbClient("skill").insert(payload);
    console.log(`✅ 已插入 (skill): ${skill.title} (${id})`);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
