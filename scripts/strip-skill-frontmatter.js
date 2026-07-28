const envId = process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID || "";
const accessKey = process.env.CLOUDBASE_ACCESS_KEY || "";

if (!envId || !accessKey) {
  console.error("Missing env");
  process.exit(1);
}

const baseUrl = `https://${envId}.api.tcloudbasegateway.com/v1/rdb/rest/skill`;

const ids = [
  "literature/lit-review-assistant",
  "ideation/research-ideation",
  "data/api-data-fetcher",
  "data/stata-data-cleaning",
  "stata",
  "analysis/r-econometrics",
  "analysis/python-panel-data",
  "writing/academic-paper-writer",
  "writing/latex-tables",
  "paper-verification",
];

function stripFrontmatter(md) {
  return md.replace(/^---\n[\s\S]*?\n---\n/, "").trim();
}

async function updateSkill(id) {
  const getUrl = new URL(baseUrl);
  getUrl.searchParams.set("select", "_id,skill_md");
  getUrl.searchParams.set("_id", `eq.${id}`);
  getUrl.searchParams.set("limit", "1");

  const getRes = await fetch(getUrl.toString(), {
    headers: { Authorization: `Bearer ${accessKey}` },
  });
  if (!getRes.ok) {
    console.error(`❌ ${id} GET failed: ${getRes.status}`);
    return false;
  }
  const data = await getRes.json();
  if (!Array.isArray(data) || data.length === 0) {
    console.error(`❌ ${id} not found`);
    return false;
  }
  const original = data[0].skill_md || "";
  const cleaned = stripFrontmatter(original);
  if (cleaned === original.trim()) {
    console.log(`⏭  ${id} no frontmatter to strip`);
    return true;
  }

  const patchUrl = new URL(baseUrl);
  patchUrl.searchParams.set("_id", `eq.${id}`);
  const patchRes = await fetch(patchUrl.toString(), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ skill_md: cleaned }),
  });
  if (!patchRes.ok) {
    const text = await patchRes.text();
    console.error(`❌ ${id} PATCH failed: ${patchRes.status} ${text}`);
    return false;
  }
  console.log(`✅ ${id} stripped frontmatter (${original.length - cleaned.length} chars removed)`);
  return true;
}

(async () => {
  let ok = 0, fail = 0;
  for (const id of ids) {
    if (await updateSkill(id)) ok++; else fail++;
  }
  console.log(`\n完成：${ok} 成功，${fail} 失败`);
})();
