# Blog Cover Image Generation Pipeline

## Overview

This directory contains scripts for automatically generating blog cover images using AI (gpt-image-2 via coding.rexai.top API).

## Quick Start

```bash
# 1. Set up environment
cp .env.example .env.local
# Edit .env.local and add your OPENAI_API_KEY

# 2. Generate missing covers
npm run generate:covers

# 3. Verify covers
npm run verify:covers

# 4. Build with cover generation
npm run build:full
```

## Scripts

### 1. `generate-cover.ts`

Generate a single cover image with custom prompt based on title and excerpt.

```bash
tsx scripts/content-pipeline/generate-cover.ts "Article Title" "Article excerpt..."
```

### 2. `generate-cover-simple.ts`

Simplified version that generates cover based on title only.

```bash
tsx scripts/content-pipeline/generate-cover-simple.ts "Article Title" "output.png"
```

### 3. `generate-all-covers.ts`

Automatically scan all blog posts and generate missing covers.

```bash
# Generate only missing covers
npm run generate:covers

# Or directly
tsx scripts/content-pipeline/generate-all-covers.ts
```

### 4. `regenerate-covers.ts`

Force regenerate all covers (useful when updating image style).

```bash
# Regenerate all covers
npm run regenerate:covers

# Or directly
tsx scripts/content-pipeline/regenerate-covers.ts --force
```

### 5. `verify-covers.ts`

Verify all covers are valid (not corrupted, reasonable size).

```bash
npm run verify:covers
```

## Integration with Build

### Full Build with Cover Generation

```bash
npm run build:full
```

This will:
1. Scan all blog posts
2. Generate missing cover images
3. Update frontmatter with cover paths
4. Build the Next.js application

### Manual Workflow

1. **Add new blog post** in `content/blog/[slug]/index.zh.md`
2. **Generate cover** (optional - will be auto-generated on build):
   ```bash
   npm run generate:covers
   ```
3. **Build**:
   ```bash
   npm run build
   ```

## Configuration

### Environment Variables

Create `.env.local` in project root:

```env
OPENAI_API_KEY=your-api-key-here
```

### API Endpoint

Default: `https://coding.rexai.top/openai/v1/responses`

Modify in scripts if needed.

## Cover Image Style

Current style prompt:
- Clean, modern illustration
- Academic research + AI technology fusion
- Soft color palette (blues, purples, warm accents)
- Minimalist composition with geometric elements
- No text, no logos, no watermarks
- Professional economics research blog header
- High quality, 1536x1024 landscape format

## File Structure

```
content/blog/
├── [slug]/
│   ├── index.zh.md      # Blog post with frontmatter
│   └── index.en.md      # English version (optional)

public/blog-covers/
├── 2026/
│   └── 05/
│       ├── [slug].png   # Generated cover image
│       └── ...

scripts/content-pipeline/
├── generate-cover.ts           # Single cover generation
├── generate-cover-simple.ts    # Simplified version
├── generate-all-covers.ts      # Batch generation
├── regenerate-covers.ts        # Force regeneration
├── verify-covers.ts            # Verification
└── README.md                   # This file
```

## Frontmatter Format

```yaml
---
slug: "article-slug"
title: "Article Title"
excerpt: "Brief description..."
cover: "/blog-covers/2026/05/article-slug.png"
date: "2026-05-21"
readTime: "20 分钟"
category: "AI 工具"
tags:
  - AI Agent
  - VSCode
author: "戴伟德"
authorRole: "经济学研究者"
---
```

## Troubleshooting

### "OPENAI_API_KEY not found"

Ensure `.env.local` exists with valid API key:
```bash
echo "OPENAI_API_KEY=your-key" > .env.local
```

### "Cover generation failed"

1. Check API endpoint availability
2. Verify API key has sufficient quota
3. Check network connectivity

### "Images not showing"

1. Verify cover path in frontmatter matches actual file location
2. Check `public/blog-covers/` directory exists
3. Ensure images are copied to standalone output (auto-handled by postbuild)

## CI/CD Integration

See [ci-cd-integration.md](ci-cd-integration.md) for:
- GitHub Actions workflows
- GitLab CI configuration
- Docker integration
- Vercel deployment

## Future Improvements

- [ ] Batch generation with rate limiting
- [ ] Style template system (watercolor, flat, 3D, etc.)
- [ ] Image optimization (WebP conversion, responsive sizes)
- [ ] CDN integration for image hosting
- [ ] A/B testing for cover image styles
