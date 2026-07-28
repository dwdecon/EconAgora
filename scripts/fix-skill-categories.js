const envId = process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID || "";
const accessKey = process.env.CLOUDBASE_ACCESS_KEY || "";

if (!envId || !accessKey) {
  console.error("Missing env");
  process.exit(1);
}

const baseUrl = `https://${envId}.api.tcloudbasegateway.com/v1/rdb/rest/skill`;

const updates = [
  { _id: "literature/lit-review-assistant", category: "综述", subcategory: "文献综述" },
  { _id: "ideation/research-ideation", category: "选题", subcategory: "选题评估" },
  { _id: "data/api-data-fetcher", category: "数据", subcategory: "获取" },
  { _id: "data/stata-data-cleaning", category: "数据", subcategory: "清洗" },
  { _id: "stata", category: "Stata", subcategory: "计量" },
  { _id: "analysis/r-econometrics", category: "R", subcategory: "计量" },
  { _id: "analysis/python-panel-data", category: "面板数据", subcategory: "计量" },
  { _id: "writing/academic-paper-writer", category: "写作", subcategory: "起草" },
  { _id: "writing/latex-tables", category: "图表", subcategory: "三线表" },
  { _id: "paper-verification", category: "投稿", subcategory: "审稿回复" },
];

async function update(id, category, subcategory) {
  const url = new URL(`${baseUrl}?_id=eq.${encodeURIComponent(id)}`);
  const res = await fetch(url.toString(), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ category, subcategory }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`❌ ${id}: ${res.status} ${text}`);
    return false;
  }
  console.log(`✅ ${id}: ${category} / ${subcategory}`);
  return true;
}

(async () => {
  let ok = 0, fail = 0;
  for (const u of updates) {
    if (await update(u._id, u.category, u.subcategory)) ok++; else fail++;
  }
  console.log(`
完成：${ok} 成功，${fail} 失败`);
})();
