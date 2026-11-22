import { chmodSync, cpSync, existsSync, lstatSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { basename, join } from "node:path";

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
  cpSync(source, destination, {
    recursive: true,
    // Asset roots contain only public files; never copy links to private paths.
    filter: (entry) => {
      const name = basename(entry);
      return name !== ".git" && name !== ".env" && !name.startsWith(".env.") &&
        !lstatSync(entry).isSymbolicLink();
    },
  });
  makeServiceReadable(destination);
}

function makeServiceReadable(directory) {
  chmodSync(directory, 0o755);
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const target = join(directory, entry.name);
    if (entry.isDirectory()) makeServiceReadable(target);
    else if (entry.isFile()) chmodSync(target, 0o644);
  }
}

copyDirectory(join(root, "public"), join(standaloneDir, "public"));
copyDirectory(join(root, ".next", "static"), join(standaloneDir, ".next", "static"));
copyDirectory(join(root, "content"), join(standaloneDir, "content"));

mkdirSync(join(root, ".next", "cache"), { recursive: true });
mkdirSync(join(standaloneDir, ".next", "cache"), { recursive: true });

console.log("[standalone-assets] copied public, .next/static, and content into .next/standalone");
