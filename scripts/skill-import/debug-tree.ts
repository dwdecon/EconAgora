import { githubApi } from "./lib/github";

async function main() {
  const d = await githubApi("/repos/dylantmoore/stata-skill/git/trees/main?recursive=1");
  console.log("keys:", Object.keys(d));
  console.log("truncated:", d.truncated);
  console.log("tree length:", d.tree?.length);
  if (!d.tree) console.log("raw:", JSON.stringify(d).slice(0, 300));
}
main();
