# EconAgora AI 辅助内容运营 - Phase 1 实施方案

> 更新日期: 2026-05-14
> 决策确认: 戴伟德

---

## 一、项目定位

- **频率**: 每周一篇
- **方向**: AI 工具在经济学研究中的应用，偏工具型
- **作者**: 戴伟德
- **中间层**: 不使用 Notion，纯代码工作流
- **封面图**: AI 生成（gpt-image-2, 1536x1024, high 质量）
- **数据源**: 暂不纳入 EconAgora 社区讨论数据（未来再评估）

---

## 二、四层架构

### Layer 1: 内容发现层（选题）

#### 2.1 数据源矩阵

| 数据源 | API/方法 | 更新频率 | 抓取内容 | 优先级 |
|--------|---------|---------|---------|--------|
| arXiv | RSS + OAI-PMH | 每日 | cs.ECON, econ.EM, q-fin 新论文 | ⭐⭐⭐ |
| NBER | Weekly email RSS | 每周 | Working Paper 摘要 | ⭐⭐⭐ |
| SSRN | RSS feed | 每日 | 最新上传 + 高下载量 | ⭐⭐ |
| RePEc | IDEAS RSS | 每周 | NEP 报告 | ⭐⭐ |
| Twitter/X | xurl CLI / API | 每日 | #EconTwitter 学术讨论 | ⭐⭐ |
| Google Trends | 搜索趋势 API | 每周 | "causal inference", "DID" 等 | ⭐ |

> 注: EconAgora 社区数据暂不纳入，待未来社区功能完善后再评估。

#### 2.2 选题评分算法

```python
score = (
    ai_tool_relevance * 0.40 +      # 与 AI 工具结合紧密度
    reproducibility * 0.35 +         # 可复现/可实操性
    timeliness * 0.25                # 时效性（新工具/新论文）
)
```

**工具型文章选题特征：**
- 明确的方法论场景（如 DID、IV、RD）
- 可操作的代码/工具演示
- 读者能跟随复现

#### 2.3 自动化选题流程

```
每日 cron → 抓取数据源 → AI 评分排序 → 飞书 digest 推送 → 人工确认
```

**飞书 digest 格式：**
```
📊 EconAgora 选题推荐（本周）

Top 3 候选：
1. [标题] - 匹配度 92%
   来源: arXiv | 关键词: LLM, causal inference
   
2. [标题] - 匹配度 87%
   来源: NBER | 关键词: AI, text analysis
   
3. [标题] - 匹配度 83%
   来源: Twitter | 关键词: Python, automation

👉 回复数字确认选题，或回复"跳过"等下周
```

---

### Layer 2: 内容生成层

#### 2.4 生成流水线

```
选题确认 → 大纲生成 → 初稿生成 → 双语生成 → 润色 → 封面图生成
```

**各阶段详细说明：**

| 阶段 | 输入 | 输出 | AI 模型 | 人工介入 |
|-----|------|------|---------|---------|
| 大纲 | 选题 + 来源论文摘要 | 结构化大纲 | Claude | 审核/调整 |
| 初稿 | 大纲 + 参考材料 | 中文初稿 | Claude | - |
| 双语 | 中文初稿 | 中英双语稿 | Claude | - |
| 润色 | 双语稿 | 最终稿 | Claude | 最终审核 |
| 封面图 | 文章主题 | 1536x1024 PNG | gpt-image-2 | - |

#### 2.5 封面图生成流程

**技术方案：**
- 接口: `POST https://coding.rexai.top/openai/v1/responses`
- 外层模型: `gpt-5.5`
- 生图模型: `gpt-image-2`
- 尺寸: `1536x1024`
- 质量: `high`
- 必须开启: `stream: true`

**提示词自动生成模板：**
```python
def generate_cover_prompt(title: str, abstract: str) -> str:
    """基于文章标题和摘要生成封面图提示词"""
    core_concepts = extract_concepts(title, abstract)
    return f"""
A clean, modern illustration about {core_concepts},
academic and professional style,
soft color palette with subtle gradients,
minimalist composition,
no text, no logos, no watermarks,
suitable for economics research blog header image,
high quality, detailed.
"""
```

**SSE 解析保存逻辑：**
```python
# 关键事件监听: response.output_item.done
# 检查: item.type == "image_generation_call" and item.result exists
# item.result 为 base64 字符串，解码后保存为 PNG
```

**保存路径约定：**
```
public/blog-covers/{YYYY}/{MM}/{slug}-{timestamp}.png
```

---

### Layer 3: 内容运营层

#### 2.6 发布流程

```
最终稿确认 → 写入 Markdown → Git commit → Build → Deploy
```

**Markdown frontmatter 规范：**
```yaml
---
title: "文章标题"
slug: "article-slug"
author: "戴伟德"
date: "2026-05-14"
category: "ai-tools"
tags: ["causal-inference", "python", "llm"]
cover: "/blog-covers/2026/05/slug-timestamp.png"
source: "arXiv:2405.xxxxx"  # 可选，标注灵感来源
---
```

**分类体系（工具型文章）：**
- `causal-inference` - 因果推断方法
- `text-analysis` - 文本分析
- `data-processing` - 数据处理
- `literature-review` - 文献工作流
- `reproduction` - 实证复现
- `writing` - 写作辅助
- `tool-review` - 工具评测

#### 2.7 多渠道分发

| 渠道 | 内容形式 | 自动化 |
|-----|---------|--------|
| EconAgora 博客 | 完整文章 | ✅ 自动部署 |
| Twitter/X | Thread 摘要 | ✅ 自动生成 |
| 飞书 | 发布通知 | ✅ 自动推送 |

**Twitter Thread 自动生成模板：**
```
🧵 [文章标题]

1/ 本周分享：[一句话核心观点]

2/ 问题背景：[经济学场景]

3/ AI 工具：[工具名称 + 作用]

4/ 核心方法：[关键步骤]

5/ 代码示例：[关键代码片段]

6/ 效果评估：[结果对比]

7/ 阅读原文：[链接]

#EconTwitter #AI #CausalInference
```

---

### Layer 4: 数据反馈层

#### 2.8 数据埋点

**CloudBase 新增表：**

```sql
-- blog_posts 扩展现有表
ALTER TABLE blog_posts ADD COLUMN view_count INT DEFAULT 0;
ALTER TABLE blog_posts ADD COLUMN like_count INT DEFAULT 0;
ALTER TABLE blog_posts ADD COLUMN share_count INT DEFAULT 0;

-- blog_analytics 埋点表
CREATE TABLE blog_analytics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_slug VARCHAR(255),
    event_type VARCHAR(50),  -- view, like, share, scroll_depth
    event_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(255)     -- 可选，匿名用户可为空
);
```

#### 2.9 周报自动生成

```
每周一 cron → 汇总上周数据 → AI 生成周报 → 飞书推送
```

**周报内容：**
- 上周文章阅读量、点赞数
- 热门标签排行
- 读者来源分析
- 本周选题建议（基于数据反馈）

---

## 三、Phase 1 实施计划（4 周）

### Week 1: 基础设施

| 任务 | 详情 | 交付物 |
|-----|------|--------|
| Markdown 迁移 | 将现有硬编码文章转为 Markdown | `content/blog/*.md` |
| blog-loader.ts | 开发 Markdown 加载器 | `src/lib/blog-loader.ts` |
| 动态路由 | `/blog/[slug]` 动态渲染 | 页面组件 |
| 封面图目录 | 创建 `public/blog-covers/` | 目录结构 |

### Week 2: 自动化选题

| 任务 | 详情 | 交付物 |
|-----|------|--------|
| arXiv API 封装 | RSS + OAI-PMH 抓取 | `scripts/fetch-arxiv.ts` |
| NBER RSS 解析 | Weekly email RSS | `scripts/fetch-nber.ts` |
| 选题评分 | AI 评分算法实现 | `scripts/score-topics.ts` |
| 飞书 digest | 每日/每周推送 | cron job |

### Week 3: 内容生成

| 任务 | 详情 | 交付物 |
|-----|------|--------|
| 大纲生成 | 基于选题生成结构化大纲 | `scripts/generate-outline.ts` |
| 初稿生成 | 中文初稿 | `scripts/generate-draft.ts` |
| 双语 pipeline | 中英双语 | `scripts/generate-bilingual.ts` |
| 润色 | 最终稿优化 | `scripts/polish.ts` |
| 封面图生成 | 集成 gpt-image-2 | `scripts/generate-cover.ts` |

### Week 4: 发布与运营

| 任务 | 详情 | 交付物 |
|-----|------|--------|
| 自动发布 | Markdown → Git → Deploy | GitHub Actions |
| 飞书通知 | 发布推送 | 飞书机器人 |
| Twitter Thread | 自动生成 | `scripts/generate-thread.ts` |
| 数据埋点 | 基础统计 | CloudBase 表 + 前端埋点 |
| 第一篇测试 | 端到端全流程测试 | 正式发布第一篇文章 |

---

## 四、技术栈汇总

| 层级 | 技术 |
|-----|------|
| 前端 | Next.js 16, React 19, Tailwind CSS v4 |
| 后端/数据库 | CloudBase RDB |
| 内容格式 | Markdown + gray-matter |
| AI 生成 | Claude (文本), gpt-image-2 (图片) |
| 图片接口 | coding.rexai.top/openai/v1/responses |
| 部署 | Nginx + Let's Encrypt (现有) |
| 自动化 | cron job + GitHub Actions |
| 通知 | 飞书机器人 |

---

## 五、风险控制

| 风险 | 应对 |
|-----|------|
| AI 生成内容质量不稳定 | 每篇文章必须人工审核，不自动发布 |
| 封面图生成失败 | 准备默认封面图作为 fallback |
| API 限流/故障 | 实现重试机制，错误飞书通知 |
| 选题枯竭 | 建立选题池，提前储备 2-4 周内容 |
| 读者反馈不足 | 初期通过 Twitter/X 互动收集反馈 |

---

## 六、成功指标

| 指标 | 目标（Phase 1 结束） |
|-----|-------------------|
| 自动化流程跑通 | 4 篇自动/半自动发布的文章 |
| 内容质量 | 每篇通过人工审核，无重大错误 |
| 发布稳定性 | 每周一篇按时发布 |
| 读者反馈 | 至少 10 条有意义的读者反馈 |
| 数据埋点 | 基础阅读数据可追踪 |

---

*文档版本: v1.0*
*下次评审: Phase 1 结束时（4 周后）*
