/**
 * Initialize blog database tables in CloudBase RDB
 * Uses the REST API to create tables
 */

const ENV_ID = process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID || "agora-8glrfnss7758021c";
const ACCESS_KEY = process.env.CLOUDBASE_ACCESS_KEY || process.env.NEXT_PUBLIC_CLOUDBASE_ACCESS_KEY;
const BASE_URL = `https://${ENV_ID}.api.tcloudbasegateway.com/v1/rdb/rest`;

async function rdbRequest(table, method, body = null, query = null) {
  const url = new URL(`${BASE_URL}/${table}`);
  if (query) {
    Object.entries(query).forEach(([k, v]) => url.searchParams.append(k, v));
  }
  
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${ACCESS_KEY}`,
    "Prefer": "return=representation",
  };
  
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });
  
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

// Check if table exists by trying to select from it
async function tableExists(table) {
  const res = await rdbRequest(table, "GET", null, { select: "count", limit: 1 });
  return res.status !== 404 && res.status < 500;
}

// Create tables by inserting schema metadata (CloudBase specific approach)
// Actually, CloudBase RDB auto-creates tables on first insert if configured
async function createTable(table, sampleData) {
  console.log(`Creating/Checking table: ${table}`);
  
  if (await tableExists(table)) {
    console.log(`  ✓ Table ${table} already exists`);
    return true;
  }
  
  // Try to insert sample data to auto-create table
  const res = await rdbRequest(table, "POST", sampleData);
  if (res.status === 201 || res.status === 200) {
    console.log(`  ✓ Table ${table} created`);
    // Delete the sample row
    const id = res.data?.id || res.data?.[0]?.id;
    if (id) {
      await rdbRequest(`${table}?id=eq.${id}`, "DELETE");
    }
    return true;
  } else {
    console.log(`  ✗ Failed to create ${table}:`, res.status, res.data);
    return false;
  }
}

async function init() {
  console.log("=== EconAgora Blog Database Initialization ===\n");
  
  if (!ACCESS_KEY) {
    console.error("ERROR: CLOUDBASE_ACCESS_KEY not set");
    process.exit(1);
  }
  
  // 1. blog_authors
  await createTable("blog_authors", {
    slug: "test-author",
    name: "Test Author",
    name_en: "Test Author",
    role: "Editor",
    role_en: "Editor",
    avatar: "",
    bio: "Test bio",
    bio_en: "Test bio",
    social_links: JSON.stringify({}),
    is_active: true,
    created_at: new Date().toISOString(),
  });
  
  // 2. blog_categories
  await createTable("blog_categories", {
    slug: "test-category",
    name: "测试分类",
    name_en: "Test Category",
    description: "测试描述",
    description_en: "Test description",
    color: "#3b82f6",
    sort_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
  });
  
  // 3. blog_tags
  await createTable("blog_tags", {
    slug: "test-tag",
    name: "测试标签",
    name_en: "Test Tag",
    color: "#10b981",
    created_at: new Date().toISOString(),
  });
  
  // 4. blog_posts
  await createTable("blog_posts", {
    slug: "test-post",
    title: "测试文章",
    title_en: "Test Post",
    excerpt: "测试摘要",
    excerpt_en: "Test excerpt",
    content: "# Test\n\nContent",
    content_en: "# Test\n\nContent",
    cover_image: "",
    author_id: 1,
    category_id: 1,
    status: "draft",
    published_at: null,
    meta_title: "",
    meta_description: "",
    reading_time: 5,
    view_count: 0,
    is_featured: false,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  
  // 5. blog_post_tags
  await createTable("blog_post_tags", {
    post_id: 1,
    tag_id: 1,
    created_at: new Date().toISOString(),
  });
  
  // 6. blog_post_stats
  await createTable("blog_post_stats", {
    post_id: 1,
    date: new Date().toISOString().split("T")[0],
    views: 0,
    unique_visitors: 0,
    created_at: new Date().toISOString(),
  });
  
  console.log("\n=== Initialization Complete ===");
}

init().catch(console.error);
