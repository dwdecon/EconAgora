/**
 * Blog view count API
 * Records page views for blog posts
 * Updates both local file storage and CloudBase database
 */

import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs/promises";
import * as path from "path";
import { incrementViewCount } from "@/lib/blog-db";

// Use absolute path to ensure data directory is always accessible
const VIEW_DATA_DIR = path.join("/var/www/EconAgora", "data/blog-views");

// Ensure data directory exists on module load
async function ensureDataDir() {
  try {
    await fs.mkdir(VIEW_DATA_DIR, { recursive: true });
  } catch {
    // Ignore errors
  }
}

// Initialize on module load
ensureDataDir();

interface ViewRecord {
  slug: string;
  views: number;
  lastViewed: string;
}

async function getViewData(): Promise<Record<string, ViewRecord>> {
  try {
    const data = await fs.readFile(
      path.join(VIEW_DATA_DIR, "views.json"),
      "utf-8"
    );
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function saveViewData(data: Record<string, ViewRecord>) {
  await fs.mkdir(VIEW_DATA_DIR, { recursive: true });
  await fs.writeFile(
    path.join(VIEW_DATA_DIR, "views.json"),
    JSON.stringify(data, null, 2)
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug } = body;

    if (!slug || typeof slug !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid slug" },
        { status: 400 }
      );
    }

    // Get current view data (local file)
    const views = await getViewData();

    // Increment view count (local file)
    if (!views[slug]) {
      views[slug] = {
        slug,
        views: 0,
        lastViewed: new Date().toISOString(),
      };
    }

    views[slug].views += 1;
    views[slug].lastViewed = new Date().toISOString();

    // Save updated data (local file)
    await saveViewData(views);

    // Also increment in CloudBase database
    try {
      await incrementViewCount(slug);
    } catch (dbError) {
      console.error("[BlogView] Failed to update CloudBase:", dbError);
      // Don't fail the request if DB update fails
    }

    return NextResponse.json({
      success: true,
      slug,
      views: views[slug].views,
    });
  } catch (error) {
    console.error("Error recording view:", error);
    return NextResponse.json(
      { error: "Failed to record view" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    const views = await getViewData();

    if (slug) {
      return NextResponse.json({
        slug,
        views: views[slug]?.views || 0,
      });
    }

    return NextResponse.json(views);
  } catch (error) {
    console.error("Error getting views:", error);
    return NextResponse.json(
      { error: "Failed to get views" },
      { status: 500 }
    );
  }
}
