import { runResearch } from "./phases/research";
import { runDiff } from "./phases/diff";
import { runImport } from "./phases/import";

const args = process.argv.slice(2);
const phase = args.find((a) => a.startsWith("--phase="))?.split("=")[1] ?? "all";
const input = args.find((a) => a.startsWith("--input="))?.split("=")[1];

(async () => {
  if (phase === "1" || phase === "all") {
    if (!input) { console.error("--input=<sources.json> required for phase 1"); process.exit(1); }
    await runResearch(input);
  }
  if (phase === "2" || phase === "all") await runDiff();
  if (phase === "3" || phase === "all") await runImport();
})();
