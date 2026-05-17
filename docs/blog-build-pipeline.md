# Blog Build Pipeline

## 完整构建流程

### 1. 环境准备

确保 `.env.local` 包含必要的 API Key：

```bash
# 检查环境变量
cat .env.local | grep OPENAI_API_KEY

# 如果没有，从 .env.production 复制或手动添加
echo "OPENAI_API_KEY=your-key" >> .env.local
```

### 2. 生成封面图（可选）

```bash
# 仅生成缺失的封面
npm run generate:covers

# 强制重新生成所有封面
npm run regenerate:covers
```

### 3. 构建应用

```bash
# 标准构建（不生成封面）
npm run build

# 完整构建（生成封面 + 构建）
npm run build:full
```

### 4. 部署

```bash
# 重启 PM2 服务
pm2 delete econagora
cd .next/standalone && pm2 start server.js --name econagora
```

## 自动化脚本

### 一键部署脚本

```bash
#!/bin/bash
set -e

echo "🚀 Starting blog deployment..."

# 1. Generate covers
echo "📸 Generating cover images..."
npm run generate:covers

# 2. Build
echo "🔨 Building application..."
npm run build

# 3. Deploy
echo "🚀 Deploying..."
pm run deploy

echo "✅ Deployment complete!"
```

### GitHub Actions 工作流

```yaml
name: Build and Deploy Blog

on:
  push:
    branches: [main]
    paths:
      - 'content/blog/**'
      - 'src/**'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Generate covers
        run: npm run generate:covers
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          
      - name: Build
        run: npm run build
        
      - name: Deploy
        run: |
          # Your deployment commands
```

## 封面图生成流程

```
┌─────────────────┐
│  1. Scan Posts  │
│  (检查缺失封面)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. Generate    │
│  (调用 gpt-image-2)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  3. Save Image  │
│  (保存到 public) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  4. Update MD   │
│  (更新 frontmatter)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  5. Build       │
│  (Next.js 构建)  │
└─────────────────┘
```

## 文件结构

```
content/blog/                    # 博客内容
├── [slug]/
│   ├── index.zh.md             # 中文文章
│   └── index.en.md             # 英文文章（可选）

public/blog-covers/             # 封面图片
├── 2026/
│   └── 05/
│       ├── [slug].png          # 生成的封面
│       └── ...

scripts/content-pipeline/       # 构建脚本
├── generate-cover.ts           # 单封面生成
├── generate-cover-simple.ts    # 简化版
├── generate-all-covers.ts      # 批量生成
├── regenerate-covers.ts        # 强制重新生成
└── README.md                   # 文档
```

## 配置选项

### 封面风格

修改 `generate-cover-simple.ts` 中的 prompt：

```typescript
const prompt = `A clean, modern illustration for an economics research blog article titled "${title}". 
The scene shows a researcher working with AI technology...
Color palette: deep blue, soft purple, warm gold accents.
Minimalist, professional style. No text, no logos, no watermarks.
High quality, detailed, suitable for blog header image.`;
```

### 图片尺寸

修改 `size` 参数：

```typescript
tools: [{
  type: "image_generation",
  model: "gpt-image-2",
  size: "1536x1024",  // 可选: 1024x1024, 1536x1024, 1024x1536
  quality: "high",     // 可选: standard, high
}]
```

## 故障排除

### 封面生成失败

1. 检查 API Key：
   ```bash
   echo $OPENAI_API_KEY
   ```

2. 检查 API 可用性：
   ```bash
   curl -I https://coding.rexai.top/openai/v1/responses
   ```

3. 查看详细错误：
   ```bash
   DEBUG=1 npm run generate:covers
   ```

### 图片不显示

1. 检查文件是否存在：
   ```bash
   ls -la public/blog-covers/2026/05/
   ```

2. 检查 frontmatter 路径：
   ```bash
   grep "^cover:" content/blog/*/index.zh.md
   ```

3. 检查构建输出：
   ```bash
   ls -la .next/standalone/public/blog-covers/
   ```

## 最佳实践

1. **预生成封面**：在写作时提前生成封面，避免构建时等待
2. **缓存封面**：封面生成后不会重复生成（除非使用 `--force`）
3. **版本控制**：封面图片应该提交到 git，避免重新生成
4. **备份**：定期备份 `public/blog-covers/` 目录

## 未来改进

- [ ] WebP 格式支持
- [ ] 响应式图片（多尺寸）
- [ ] CDN 集成
- [ ] 图片压缩优化
- [ ] 风格模板系统
