-- EconAgora Blog Database Schema
-- Run this in CloudBase SQL console

-- Authors table
CREATE TABLE IF NOT EXISTS blog_authors (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    avatar VARCHAR(500),
    bio TEXT,
    bio_en TEXT,
    role VARCHAR(100),
    role_en VARCHAR(100),
    email VARCHAR(200),
    social_links JSON DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS blog_categories (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    description TEXT,
    description_en TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tags table
CREATE TABLE IF NOT EXISTS blog_tags (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Posts table (main content in MD files, metadata in DB)
CREATE TABLE IF NOT EXISTS blog_posts (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    featured BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    author_id INTEGER REFERENCES blog_authors(id),
    category_id INTEGER REFERENCES blog_categories(id),
    cover_image VARCHAR(500),
    cover_image_en VARCHAR(500),
    issue VARCHAR(50),
    read_time VARCHAR(20),
    read_time_en VARCHAR(20),
    -- i18n content stored as JSON (title, excerpt, title_en, excerpt_en)
    title_i18n JSON NOT NULL,
    excerpt_i18n JSON NOT NULL,
    -- Content file paths
    content_path_zh VARCHAR(255),
    content_path_en VARCHAR(255),
    -- SEO
    seo_title VARCHAR(200),
    seo_description TEXT,
    seo_keywords TEXT,
    -- Theme colors (for cover styling)
    theme JSON DEFAULT '{
        "coverStart": "#faf9f5",
        "coverEnd": "#f0ede5",
        "spine": "#c45c26",
        "accent": "#1a1a1a",
        "shadow": "rgba(0,0,0,0.08)"
    }'::json
);

-- Post-Tag junction table
CREATE TABLE IF NOT EXISTS blog_post_tags (
    post_id INTEGER REFERENCES blog_posts(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES blog_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- Post stats table (views, reads)
CREATE TABLE IF NOT EXISTS blog_post_stats (
    post_id INTEGER PRIMARY KEY REFERENCES blog_posts(id) ON DELETE CASCADE,
    view_count INTEGER DEFAULT 0,
    read_count INTEGER DEFAULT 0,
    unique_viewers INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Post views log (for analytics, optional)
CREATE TABLE IF NOT EXISTS blog_post_views (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES blog_posts(id) ON DELETE CASCADE,
    viewer_ip VARCHAR(45),
    viewer_hash VARCHAR(64),
    user_agent TEXT,
    referer TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default author: 戴伟德
INSERT INTO blog_authors (slug, name, name_en, bio, bio_en, role, role_en, avatar) 
VALUES (
    'dai-weide',
    '戴伟德',
    'David Dai',
    '经济学研究者，EconAgora 创始人。专注于 AI 工具在经济学研究中的应用。',
    'Economics researcher and founder of EconAgora. Focused on AI tools in economics research.',
    '经济学研究者',
    'Economics Researcher',
    '/avatars/dai-weide.jpg'
) ON CONFLICT (slug) DO NOTHING;

-- Insert default author: EconAgora Editorial Desk
INSERT INTO blog_authors (slug, name, name_en, bio, bio_en, role, role_en) 
VALUES (
    'econagora-editorial',
    'EconAgora Editorial Desk',
    'EconAgora Editorial Desk',
    'EconAgora 编辑部，专注于研究方法、复现工程和 AI 工具的内容创作。',
    'EconAgora Editorial Desk, focused on research methods, replication engineering, and AI tools.',
    '研究流程编辑',
    'Research Workflow Editor'
) ON CONFLICT (slug) DO NOTHING;

-- Insert categories
INSERT INTO blog_categories (slug, name, name_en, description, description_en, sort_order) VALUES
('ai-tools', 'AI 工具', 'AI Tools', 'AI 工具配置与使用教程', 'AI tool configuration and usage tutorials', 1),
('research-workflow', '研究工作流', 'Research Workflow', '经济学研究流程设计与优化', 'Economics research workflow design and optimization', 2),
('replication', '复现工程', 'Replication Engineering', '论文复现与数据治理', 'Paper replication and data governance', 3),
('causal-inference', '因果推断', 'Causal Inference', '因果推断方法与审计', 'Causal inference methods and auditing', 4),
('system-design', '系统设计', 'System Design', 'AI 系统架构设计', 'AI system architecture design', 5),
('knowledge-management', '知识管理', 'Knowledge Management', '研究知识管理与 Agent 记忆', 'Research knowledge management and agent memory', 6)
ON CONFLICT (slug) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_posts_author ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_category ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_featured ON blog_posts(featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_post_tags_post ON blog_post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag ON blog_post_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_views_post ON blog_post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_views_created ON blog_post_views(created_at);
