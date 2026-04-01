import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env") });

import { serverDb } from "@/lib/rdb-server";

async function viewPrompts() {
  const { data: prompts, error } = await serverDb
    .from("prompt")
    .select("_id, title, category")
    .execute();

  if (error) {
    console.error("Failed to fetch prompts:", error);
    return;
  }

  console.log("Current prompts:");
  prompts?.forEach((p) => {
    console.log(`${p._id}: "${p.title}" - category: "${p.category}"`);
  });
}

viewPrompts().catch(console.error);
