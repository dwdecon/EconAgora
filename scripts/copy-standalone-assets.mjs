import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const standaloneDir = join(root, ".next", "standalone");

if (!existsSync(standaloneDir)) {
  console.warn("[standalone-assets] skipped: .next/standalone does not exist");
  process.exit(0);
}

function copyDirectory(source, destination) {
  if (!existsSync(source)) {
    return;
  }

  rmSync(destination, { recursive: true, force: true });
  mkdirSync(destination, { recursive: true });
  cpSync(source, destination, { recursive: true });
}

copyDirectory(join(root, "public"), join(standaloneDir, "public"));
copyDirectory(join(root, ".next", "static"), join(standaloneDir, ".next", "static"));
copyDirectory(join(root, "content"), join(standaloneDir, "content"));

mkdirSync(join(root, ".next", "cache"), { recursive: true });
mkdirSync(join(standaloneDir, ".next", "cache"), { recursive: true });

console.log("[standalone-assets] copied public, .next/static, and content into .next/standalone");
