import * as fs from "fs";
import * as path from "path";
import { downloadFile } from "../lib/github";
import { parseSkillMd, extractSkillFromZip } from "../lib/parse-skill";
import type { PendingImport } from "./diff";

const DATA_DIR = path.join(__dirname, "../data");

function escSql(s: string | null): string {
  if (s === null) return "NULL";
  return `'${s
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\r?\n/g, "\\n")
    .replace(/\t/g, "\\t")}'`;
}

export async function runImport(): Promise<void> {
  const pending: PendingImport[] = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "pending-import.json"), "utf8")
  );

  const sqls: string[] = [];
  const errors: { id: string; error: string }[] = [];

  for (const item of pending) {
    process.stdout.write(`Preparing ${item.id}... `);
    try {
      const buf = await downloadFile(item.repo, item.skill_path);
      let skillMd: string;
      if (item.skill_path.endsWith(".skill")) {
        skillMd = extractSkillFromZip(buf)?.body ?? buf.toString("utf8");
      } else {
        skillMd = parseSkillMd(buf.toString("utf8")).body;
      }

      const fm = item.frontmatter;
      const cols = "_id,title,description,category,tags,skill_md,workflow_stage,platform,source_repo,source_url,install_command,author_id,like_count,view_count,status";
      const vals = [
        escSql(item.id),
        escSql(fm.name ?? item.skill_name),
        escSql(fm.description ?? null),
        escSql(item.category),
        escSql(Array.isArray(fm.tags) ? JSON.stringify(fm.tags) : "[]"),
        escSql(skillMd),
        escSql(fm.workflow_stage ?? null),
        escSql(fm.compatibility ?? fm.platform ?? null),
        escSql(item.repo),
        escSql(item.source_url),
        escSql(item.install_command ?? null),
        escSql(item.repo.split("/")[0]),
        "0", "0",
        escSql("PUBLISHED"),
      ].join(",");
      sqls.push(`INSERT IGNORE INTO skill (${cols}) VALUES (${vals});`);
      console.log("OK");
    } catch (e) {
      console.log(`ERROR: ${(e as Error).message}`);
      errors.push({ id: item.id, error: (e as Error).message });
    }
  }

  fs.writeFileSync(path.join(DATA_DIR, "import.sql"), sqls.join("\n") + "\n");
  fs.writeFileSync(
    path.join(DATA_DIR, "import-report.json"),
    JSON.stringify({ total: pending.length, prepared: sqls.length, errors }, null, 2)
  );
  console.log(`\nWrote import.sql (${sqls.length} statements)`);
  if (errors.length) errors.forEach((e) => console.log(`  ${e.id}: ${e.error}`));
}
