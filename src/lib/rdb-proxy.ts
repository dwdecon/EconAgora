import { verifySessionToken } from "@/lib/auth-local";
import { getSessionToken } from "@/lib/cloudbase-server-auth";

// Keep the browser boundary independent from broad legacy database grants.
const PUBLIC_COLUMNS: Record<string, string> = {
  prompt: "_id,title,content,description,category,subcategory,tags,status,download_count,like_count,view_count,is_featured,author_id,author_name,source_date,locale,created_at,updated_at",
  skill: "_id,title,description,category,subcategory,tags,skill_md,workflow_stage,platform,source_repo,source_slug,repo_folder,source_url,install_command,author_id,author_name,like_count,view_count,status,locale,created_at,updated_at,title_zh,description_zh,tutorial,code_examples,use_cases",
  tool: "_id,title,official_url,description,category,subcategory,tags,readme_content,author_id,author_name,like_count,view_count,download_count,status,locale,created_at,updated_at,title_zh,description_zh,docs_url,quick_start,integration_guide",
  post: "_id,title,content,tags,category,locale,pinned,is_agent_post,like_count,comment_count,status,author_id,author_name,created_at,updated_at",
  comment: "_id,target_type,target_id,parent_id,content,is_agent_comment,author_id,author_name,created_at,updated_at",
  user_profile: "_id,cloudbase_uid,name,avatar,affiliation,bio,locale,created_at,updated_at",
  user_like: "_id,user_id,target_type,target_id,created_at",
};
const PUBLISHED_TABLES = new Set(["post", "prompt", "skill", "tool"]);
const MAX_RESPONSE_BYTES = 8 * 1024 * 1024;

function errorResponse(status: number, message: string) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function proxyRdbRead(request: Request, path: string[]): Promise<Response> {
  if (!["GET", "HEAD"].includes(request.method)) return errorResponse(405, "Direct database writes are not allowed.");
  const table = path[0];
  if (path.length !== 1 || !Object.hasOwn(PUBLIC_COLUMNS, table)) return errorResponse(404, "Resource not found.");
  const incoming = new URL(request.url);
  if (incoming.search.length > 8192) return errorResponse(414, "Query is too long.");
  const allowed = new Set(PUBLIC_COLUMNS[table].split(","));
  const params = new URLSearchParams(incoming.search);
  const selected = params.get("select") ?? "*";
  if (selected === "*") params.set("select", PUBLIC_COLUMNS[table]);
  else if (!selected.split(",").every((field) => allowed.has(field.trim()))) {
    return errorResponse(403, "Only public columns can be selected.");
  }
  if (selected !== "*") params.set("select", selected.split(",").map((field) => field.trim()).join(","));
  for (const [key, value] of params) {
    if (["select", "limit", "offset"].includes(key)) continue;
    if (key === "order") {
      if (!value.split(",").every((part) => {
        const [field, ...options] = part.split(".");
        return allowed.has(field) && options.every((option) => ["asc", "desc", "nullsfirst", "nullslast"].includes(option));
      })) return errorResponse(400, "Invalid sort order.");
    } else if (["or", "and"].includes(key)) {
      // The application emits plain column identifiers. Reject quoted field
      // syntax rather than partially parsing PostgREST's escape grammar.
      if (/(?:^|[(,])\s*"/.test(value)) return errorResponse(400, "Quoted filter columns are not supported.");
      for (const match of value.matchAll(/(?:^|[(,])\s*([A-Za-z_]\w*)\s*\./g)) {
        if (!allowed.has(match[1])) return errorResponse(400, "Invalid filter column.");
      }
    } else if (!allowed.has(key)) return errorResponse(400, "Invalid query parameter.");
  }
  const rawLimit = Number(params.get("limit") ?? 50);
  const offset = Number(params.get("offset") ?? 0);
  if (!Number.isSafeInteger(rawLimit) || rawLimit < 0 || !Number.isSafeInteger(offset) || offset < 0 || offset > 100_000) {
    return errorResponse(400, "Invalid pagination.");
  }
  params.set("limit", String(Math.min(rawLimit, 200)));
  params.set("offset", String(offset));
  if (PUBLISHED_TABLES.has(table)) params.append("status", "eq.PUBLISHED");
  const token = getSessionToken(request);
  const user = token ? verifySessionToken(token) : null;
  if (table === "user_like") {
    if (!user) return errorResponse(401, "A session is required.");
    params.append("user_id", `eq.${user.id}`);
  }
  const upstream = new URL(`${(process.env.RDB_BASE_URL || "http://127.0.0.1:3100").replace(/\/$/, "")}/${table}`);
  upstream.search = params.toString();
  const headers = new Headers({ Accept: "application/json" });
  if (user && token) headers.set("Authorization", `Bearer ${token}`);
  if (request.headers.get("accept") === "application/vnd.pgrst.object+json") headers.set("Accept", "application/vnd.pgrst.object+json");
  if (request.headers.get("prefer")?.split(",").some((value) => value.trim() === "count=exact")) headers.set("Prefer", "count=exact");
  try {
    if (table === "comment") {
      const type = params.get("target_type");
      const target = params.get("target_id") ?? "";
      if (params.getAll("target_type").length !== 1 || params.getAll("target_id").length !== 1 ||
          !["eq.POST", "eq.PROMPT"].includes(type ?? "")) {
        return errorResponse(400, "Comments must be scoped to a public thread.");
      }
      const ids = target.startsWith("eq.") ? [target.slice(3)]
        : target.startsWith("in.(") && target.endsWith(")") ? target.slice(4, -1).split(",") : [];
      if (!ids.length || ids.length > 200 || ids.some((id) => !/^[A-Za-z0-9_-]{1,128}$/.test(id))) {
        return errorResponse(400, "Invalid comment target.");
      }
      const parent = new URL(upstream);
      parent.pathname = parent.pathname.replace(/comment$/, type === "eq.POST" ? "post" : "prompt");
      parent.search = new URLSearchParams({ select: "_id", _id: `in.(${ids.join(",")})`, status: "eq.PUBLISHED", limit: "200" }).toString();
      const parentHeaders = new Headers(headers);
      parentHeaders.set("Accept", "application/json");
      parentHeaders.delete("Prefer");
      const parents = await fetch(parent, { headers: parentHeaders, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10_000) });
      if (!parents.ok) return errorResponse(503, "Unable to verify comment visibility.");
      const rows: unknown = await parents.json();
      if (!Array.isArray(rows)) return errorResponse(503, "Unable to verify comment visibility.");
      const visible = rows.map((row) => row?._id).filter((id): id is string => typeof id === "string" && ids.includes(id));
      if (!visible.length) {
        return new Response(request.method === "HEAD" ? null : "[]", {
          headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store", "Content-Range": "*/0" },
        });
      }
      params.set("target_id", `in.(${visible.join(",")})`);
      upstream.search = params.toString();
    }
    const response = await fetch(upstream, {
      method: request.method, headers, cache: "no-store", redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status >= 500) return errorResponse(503, "Data service is temporarily unavailable.");
    if (Number(response.headers.get("Content-Length")) > MAX_RESPONSE_BYTES) {
      await response.body?.cancel();
      return errorResponse(503, "Data response exceeds the size limit.");
    }
    let body: Uint8Array | null = null;
    if (request.method !== "HEAD" && response.body) {
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let length = 0;
      try {
        while (true) {
          const next = await reader.read();
          if (next.done) break;
          length += next.value.byteLength;
          if (length > MAX_RESPONSE_BYTES) {
            await reader.cancel();
            return errorResponse(503, "Data response exceeds the size limit.");
          }
          chunks.push(next.value);
        }
      } finally { reader.releaseLock(); }
      body = new Uint8Array(length);
      let position = 0;
      for (const chunk of chunks) { body.set(chunk, position); position += chunk.byteLength; }
    }
    const outgoing = new Headers({ "Content-Type": "application/json; charset=utf-8", "Cache-Control": "private, no-store" });
    for (const name of ["Content-Range", "Preference-Applied"]) {
      const value = response.headers.get(name);
      if (value) outgoing.set(name, value);
    }
    return new Response(body as BodyInit | null, { status: response.status, headers: outgoing });
  } catch {
    return errorResponse(503, "Data service is temporarily unavailable.");
  }
}
