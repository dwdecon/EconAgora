import * as fs from "fs";
import * as path from "path";
import { getRepoMeta } from "../lib/github";

const DATA_DIR = path.join(__dirname, "../data");

export interface SourceEntry {
  repo: string;
  install_command: string | null;
}

export interface VerifiedSource extends SourceEntry {
  stars: number;
  description: string;
  verified: boolean;
}

export async function runResearch(inputPath: string): Promise<void> {
  const sources: SourceEntry[] = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const results: VerifiedSource[] = [];

  for (const src of sources) {
    process.stdout.write(`Verifying ${src.repo}... `);
    const meta = await getRepoMeta(src.repo);
    console.log(meta.exists ? `OK (${meta.stars}★)` : "NOT FOUND");
    results.push({ ...src, ...meta, verified: meta.exists });
  }

  const outPath = path.join(DATA_DIR, "verified-sources.json");
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\nWrote ${outPath}`);
  console.log(`Verified: ${results.filter((r) => r.verified).length}/${results.length}`);
}
