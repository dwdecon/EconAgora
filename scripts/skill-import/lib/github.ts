import * as https from "https";
import * as http from "http";

function get(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const token = process.env.GITHUB_TOKEN;
    const headers: Record<string, string> = { "User-Agent": "EconAgora-Importer/1.0" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const req = client.get(url, { headers }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        resolve(get(res.headers.location!));
        return;
      }
      const chunks: Buffer[] = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    });
    req.on("error", reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error("timeout")); });
  });
}

export async function githubApi(path: string): Promise<any> {
  const url = `https://api.github.com${path}`;
  const raw = await get(url);
  return JSON.parse(raw);
}

export async function getRepoMeta(repo: string): Promise<{ stars: number; description: string; exists: boolean }> {
  try {
    const d = await githubApi(`/repos/${repo}`);
    return { stars: d.stargazers_count ?? 0, description: d.description ?? "", exists: true };
  } catch {
    return { stars: 0, description: "", exists: false };
  }
}

export async function getFileTree(repo: string): Promise<string[]> {
  const d = await githubApi(`/repos/${repo}/git/trees/main?recursive=1`);
  return (d.tree as any[]).filter((f) => f.type === "blob").map((f) => f.path as string);
}

export async function downloadFile(repo: string, path: string): Promise<Buffer> {
  const d = await githubApi(`/repos/${repo}/contents/${path.split("/").map(encodeURIComponent).join("/")}`);
  return Buffer.from(d.content.replace(/\n/g, ""), "base64");
}

export function rawUrl(repo: string, path: string): string {
  return `https://raw.githubusercontent.com/${repo}/main/${path}`;
}
