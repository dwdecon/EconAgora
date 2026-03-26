import { NextRequest, NextResponse } from "next/server";

const CLOUDBASE_ENV_ID = process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID || "agora-8glrfnss7758021c";
const CLOUDBASE_ACCESS_KEY = process.env.CLOUDBASE_ACCESS_KEY || process.env.NEXT_PUBLIC_CLOUDBASE_ACCESS_KEY || "";

const BASE_URL = `https://${CLOUDBASE_ENV_ID}.api.tcloudbasegateway.com`;

/**
 * Query a prompt by ID from CloudBase MySQL database
 * Uses the MySQL RESTful API with query parameter filtering (no SQL injection risk)
 */
async function queryPrompt(id: string) {
  // Sanitize ID to prevent injection (only allow alphanumeric, underscore, hyphen)
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeId) return null;

  try {
    const url = `${BASE_URL}/v1/rdb/rest/prompt?_id=eq.${encodeURIComponent(safeId)}&select=_id,title,content,download_count&limit=1`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${CLOUDBASE_ACCESS_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      console.error("[download] query failed:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch (err) {
    console.error("[download] query error:", err);
    return null;
  }
}

/**
 * Increment the download_count for a prompt
 * Uses arithmetic increment — atomic at the database level, no race condition
 */
async function incrementDownloadCount(id: string): Promise<boolean> {
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeId) return false;

  try {
    const updateUrl = `${BASE_URL}/v1/rdb/rest/prompt?_id=eq.${encodeURIComponent(safeId)}`;
    const updateRes = await fetch(updateUrl, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${CLOUDBASE_ACCESS_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
      },
      // Arithmetic increment — atomic, no read-then-write race
      body: JSON.stringify({
        "download_count+": 1,
      }),
    });

    if (!updateRes.ok) {
      console.error("[download] update count failed:", updateRes.status, await updateRes.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[download] update error:", err);
    return false;
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Missing prompt ID" }, { status: 400 });
    }

    // Query the prompt from database
    const prompt = await queryPrompt(id);

    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    // Increment download count (non-blocking, best effort)
    // Fire and forget - don't fail the download if count update fails
    incrementDownloadCount(id).catch(() => {});

    // Build the downloadable content
    const content = `# ${prompt.title || 'Untitled Prompt'}\n\n${prompt.content || ''}`;

    // Generate safe filename from title
    const safeTitle = (prompt.title || 'prompt')
      .replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_')
      .substring(0, 50);
    const filename = `${safeTitle}.txt`;

    // Return as downloadable text file
    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": Buffer.byteLength(content).toString(),
      },
    });
  } catch (err) {
    console.error("[download] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
