const SKILL_PATH_PATTERNS = [
  /^skills\/[^/]+\/SKILL\.md$/,
  /^plugin\/skills\/[^/]+\/SKILL\.md$/,
  /^plugins\/[^/]+\/skills\/[^/]+\/SKILL\.md$/,
  /^\.claude\/skills\/[^/]+\/SKILL\.md$/,
  /^SKILL\.md$/,
];

const EXCLUDE = ["commands/", "agents/", "hooks/", "tests/"];

export function findSkillFiles(tree: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const path of tree) {
    if (EXCLUDE.some((ex) => path.includes(ex))) continue;
    if (path.endsWith(".skill")) { result.push(path); continue; }
    if (!path.endsWith("SKILL.md")) continue;
    if (!SKILL_PATH_PATTERNS.some((p) => p.test(path))) continue;

    // deduplicate by skill folder name
    const folder = path.split("/").slice(-2, -1)[0];
    if (seen.has(folder)) {
      // prefer .claude/ path
      const existing = result.findIndex((r) => r.split("/").slice(-2, -1)[0] === folder);
      if (existing !== -1 && path.includes(".claude/")) result[existing] = path;
      continue;
    }
    seen.add(folder);
    result.push(path);
  }

  return result;
}

export function skillSlugFromPath(path: string): string {
  if (path.endsWith(".skill")) return path.replace(/\.skill$/, "").split("/").pop()!;
  return path.split("/").slice(-2, -1)[0];
}

const CATEGORY_RULES: [RegExp, string][] = [
  [/paper|writing|latex|abstract|introduction|conclusion/i, "writing"],
  [/data|dataset|analysis|stata|regression|econom/i, "data-analysis"],
  [/literature|research|review|survey/i, "literature"],
  [/reproduce|debug|code|experiment|launch/i, "coding"],
];

export function inferCategory(skillName: string, repo: string): string {
  const repoMap: Record<string, string> = {
    "dylantmoore/stata-skill": "data-analysis",
    "hanlulong/econ-writing-skill": "writing",
    "jusi-aalto/strategic-revision": "writing",
  };
  if (repoMap[repo]) return repoMap[repo];
  for (const [re, cat] of CATEGORY_RULES) {
    if (re.test(skillName)) return cat;
  }
  return "research-tools";
}
