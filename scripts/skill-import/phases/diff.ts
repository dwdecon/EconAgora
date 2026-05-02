import * as fs from "fs";
import * as path from "path";
import { getFileTree, rawUrl } from "../lib/github";
import { findSkillFiles, skillSlugFromPath, inferCategory } from "../lib/skill-discovery";
import { parseSkillMd } from "../lib/parse-skill";
import { downloadFile } from "../lib/github";

const DATA_DIR = path.join(__dirname, "../data");

export interface PendingImport {
  id: string;
  repo: string;
  skill_path: string;
  source_url: string;
  install_command: string | null;
  skill_name: string;
  category: string;
  frontmatter: Record<string, any>;
}

async function getExistingIds(): Promise<Set<string>> {
  const cachePath = path.join(DATA_DIR, "existing-ids.json");
  if (fs.existsSync(cachePath)) {
    const ids: string[] = JSON.parse(fs.readFileSync(cachePath, "utf8"));
    console.log(`Loaded ${ids.length} existing IDs from cache`);
    return new Set(ids);
  }
  console.warn("existing-ids.json not found, proceeding with empty set");
  return new Set();
}

export async function runDiff(): Promise<void> {
  const verifiedPath = path.join(DATA_DIR, "verified-sources.json");
  const sources = JSON.parse(fs.readFileSync(verifiedPath, "utf8"));
  const verified = sources.filter((s: any) => s.verified);

  console.log("Querying existing skill IDs from DB...");
  const existingIds = await getExistingIds();
  console.log(`Found ${existingIds.size} existing skills in DB`);

  const pending: PendingImport[] = [];

  for (const src of verified) {
    console.log(`\nScanning ${src.repo}...`);
    let tree: string[];
    try {
      tree = await getFileTree(src.repo);
    } catch (e) {
      console.warn(`  Failed to get tree: ${(e as Error).message}`);
      continue;
    }

    const skillFiles = findSkillFiles(tree);
    console.log(`  Found ${skillFiles.length} skill file(s)`);

    for (const skillPath of skillFiles) {
      let skillName = skillSlugFromPath(skillPath);

      // Try to get name from frontmatter
      try {
        const buf = await downloadFile(src.repo, skillPath);
        const parsed = parseSkillMd(buf.toString("utf8", undefined, undefined));
        if (parsed.frontmatter.name) skillName = parsed.frontmatter.name;

        const id = `${src.repo}/${skillName}`;
        if (existingIds.has(id)) {
          console.log(`  SKIP (exists): ${id}`);
          continue;
        }

        pending.push({
          id,
          repo: src.repo,
          skill_path: skillPath,
          source_url: rawUrl(src.repo, skillPath),
          install_command: src.install_command,
          skill_name: skillName,
          category: inferCategory(skillName, src.repo),
          frontmatter: parsed.frontmatter as Record<string, any>,
        });
        console.log(`  + ${id}`);
      } catch (e) {
        console.warn(`  Failed to parse ${skillPath}: ${(e as Error).message}`);
      }
    }
  }

  const outPath = path.join(DATA_DIR, "pending-import.json");
  fs.writeFileSync(outPath, JSON.stringify(pending, null, 2));
  console.log(`\nWrote ${outPath}`);
  console.log(`Pending: ${pending.length} skills to import`);
}
