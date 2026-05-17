# CI/CD Integration for Blog Cover Generation

## 概述

本文档说明如何将封面图生成集成到 CI/CD 流程中。

## GitHub Actions 工作流

### 1. 基本工作流

```yaml
# .github/workflows/blog-deploy.yml
name: Blog Build and Deploy

on:
  push:
    branches: [main]
    paths:
      - 'content/blog/**'
      - 'src/**'
      - 'public/**'

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Verify covers
        run: npm run verify:covers
        continue-on-error: true
      
      - name: Generate missing covers
        run: npm run generate:covers
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
      
      - name: Build application
        run: npm run build
      
      - name: Deploy
        run: |
          # 你的部署命令
          echo "Deploying..."
```

### 2. 定时重新生成封面

```yaml
# .github/workflows/regenerate-covers.yml
name: Regenerate Blog Covers

on:
  schedule:
    # 每月 1 日重新生成封面
    - cron: '0 0 1 * *'
  workflow_dispatch:

jobs:
  regenerate:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Regenerate all covers
        run: npm run regenerate:covers
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
      
      - name: Commit changes
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add public/blog-covers/
          git add content/blog/
          git commit -m "chore: regenerate blog covers [skip ci]" || true
          git push
```

### 3. PR 预览工作流

```yaml
# .github/workflows/preview.yml
name: PR Preview

on:
  pull_request:
    paths:
      - 'content/blog/**'

jobs:
  preview:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Generate covers for new posts
        run: npm run generate:covers
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
      
      - name: Build
        run: npm run build
      
      - name: Deploy preview
        uses: some-deploy-action@v1
        with:
          preview: true
```

## GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - build
  - deploy

variables:
  NODE_VERSION: "22"

build:
  stage: build
  image: node:${NODE_VERSION}
  script:
    - npm ci
    - npm run generate:covers
    - npm run build
  artifacts:
    paths:
      - .next/standalone/
  only:
    - main

deploy:
  stage: deploy
  script:
    - echo "Deploying..."
  only:
    - main
```

## Docker 集成

### Dockerfile

```dockerfile
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Generate covers and build
ARG OPENAI_API_KEY
ENV OPENAI_API_KEY=${OPENAI_API_KEY}
RUN npm run generate:covers
RUN npm run build

# Production image
FROM node:22-alpine AS runner

WORKDIR /app

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  blog:
    build:
      context: .
      args:
        - OPENAI_API_KEY=${OPENAI_API_KEY}
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
```

## Vercel 集成

### vercel.json

```json
{
  "buildCommand": "npm run build:full",
  "env": {
    "OPENAI_API_KEY": "@openai-api-key"
  }
}
```

### Build Script

```json
{
  "scripts": {
    "build:full": "npm run generate:covers && npm run build"
  }
}
```

## 环境变量配置

### GitHub Secrets

1. 进入 Settings → Secrets and variables → Actions
2. 添加 `OPENAI_API_KEY`

### GitLab Variables

1. 进入 Settings → CI/CD → Variables
2. 添加 `OPENAI_API_KEY`

### Vercel Environment Variables

1. 进入 Project Settings → Environment Variables
2. 添加 `OPENAI_API_KEY`

## 监控和日志

### 构建日志

```bash
# 查看封面生成日志
npm run generate:covers 2>&1 | tee cover-generation.log

# 查看验证结果
npm run verify:covers 2>&1 | tee cover-verification.log
```

### 性能监控

```bash
# 测量构建时间
time npm run build:full

# 检查图片大小
find public/blog-covers -type f -exec ls -lh {} \;
```

## 故障排除

### 构建失败

1. 检查 API Key：
   ```bash
   echo $OPENAI_API_KEY | head -c 10
   ```

2. 检查 API 可用性：
   ```bash
   curl -I https://coding.rexai.top/openai/v1/responses
   ```

3. 查看详细日志：
   ```bash
   DEBUG=1 npm run generate:covers
   ```

### 图片生成超时

增加超时时间：
```bash
HTTP_TIMEOUT=300 npm run generate:covers
```

### 内存不足

减少并发：
```bash
CONCURRENCY=1 npm run generate:covers
```

## 最佳实践

1. **缓存封面图**：将生成的封面提交到 git，避免重复生成
2. **增量生成**：只生成新文章的封面，不要每次构建都重新生成
3. **监控成本**：跟踪 API 调用次数和费用
4. **备份策略**：定期备份封面图片
5. **版本控制**：封面图片应该版本化，便于回滚

## 安全注意事项

1. **保护 API Key**：
   - 使用 GitHub Secrets / GitLab Variables
   - 不要在代码中硬编码
   - 定期轮换

2. **限制权限**：
   - 使用最小权限原则
   - 监控异常调用

3. **审计日志**：
   - 记录所有生成操作
   - 监控 API 使用量
