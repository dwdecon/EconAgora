# EconAgora 旧博客文章重写计划

> **目标**：按 `econagora-blog-writing` skill 的最新标准，将 9 篇已发布旧文章全部重写为可执行、证据优先、中英双语的研究教程。

---

## 一、项目上下文

### 当前状态
- 博客目录：`/var/www/EconAgora/content/blog/[slug]/index.{zh,en}.md`
- 9 篇旧文章已完成 frontmatter 统一（series / seriesOrder / status / issue）
- 1 篇新草稿 `skill-based-literature-review` 已作为新标准的参考模板
- 当前 build 已通过（Next.js 16 + Turbopack）

### 文章分类

| 类型 | 篇数 | 特点 |
|---|---|---|
| 短文/宣言 | 5 | < 700 字，概念性内容，无具体步骤 |
| 详细教程 | 4 | 8000–18000 字，有命令/配置/代码 |
| 标准模板 | 1 | 已接近新标准，需要最终打磨 |

---

## 二、交付物清单

### 必须交付
1. 9 篇中文博客正文全部重写
2. 9 篇英文博客正文（rewrite for international researchers，非直译）
3. 每篇文章的 frontmatter 完整且一致
4. 所有链接、命令、论文引用真实可验证
5. 每阶段结束 `pnpm build` 通过
6. 最终 Git commit 记录重写过程

### 可选交付
7. 封面图一致性检查：若风格不一致则重新生成
8. 系列导航组件增强：确保系列内上下篇链接正确

---

## 三、执行阶段

### Stage 0 — 计划确认（当前）
- 输出本计划文档
- 用户确认范围、顺序、英文策略、命令验证级别
- **不开始写作，直到用户批准计划**

### Stage 1 — 重写 5 篇短文/宣言
目标：快速建立系列基调，每篇控制在 1200–2000 字。

| 顺序 | slug | 系列 | 主题 |
|---|---|---|---|
| 1.1 | `prompt-skill-tool-copilot` | ai-research-best-practices | 用 Prompt/Skill/Tool 三层构建研究 Copilot |
| 1.2 | `agent-memory-for-semesters` | ai-research-best-practices | Agent 记忆跨学期存活 |
| 1.3 | `from-pdf-to-panel` | paper-projects | 文献综述的四代理工作流 |
| 1.4 | `auditing-ai-identification` | paper-projects | 审计 AI 生成的识别策略 |
| 1.5 | `replication-breaks-before-regression` | paper-projects | 复现死在回归之前 |

每篇流程：
1. 用 web-content-fetcher / jina.ai 搜集 3–5 个权威来源
2. 输出引用清单 + 核心主张
3. 输出 frontmatter + 详细大纲
4. 用户确认
5. 写中文正文
6. 写英文正文
7. 扫描 business jargon
8. `pnpm build`
9. commit

### Stage 2 — 重写 4 篇详细教程
目标：每篇 3000–6000 字，必须有可执行的命令/配置/代码。

| 顺序 | slug | 系列 | 主题 |
|---|---|---|---|
| 2.1 | `ai-agent-research-setup` | ai-research-best-practices | 配置第一个科研 Agent |
| 2.2 | `agent-zotero-integration` | ai-research-best-practices | Zotero + MCP 接入 Agent |
| 2.3 | `claude-code-stata-mcp` | ai-research-best-practices | Stata MCP 实证分析 |
| 2.4 | `llm-assisted-did-design` | paper-projects | LLM 辅助 DID 识别策略设计 |

每篇流程：
1. 深度资料搜集：官方文档、GitHub、社区 issues、相关论文
2. 输出引用清单 + 核心主张
3. 输出 frontmatter + 详细大纲
4. 用户确认
5. 写中文正文（包含前置条件、步骤、可复制模板、常见错误、下一步）
6. 验证命令/配置格式正确（实际可运行性受 GUI 工具限制）
7. 写英文正文
8. 扫描 business jargon
9. `pnpm build`
10. commit

### Stage 3 — 打磨标准模板
目标：让 `skill-based-literature-review` 成为未来新文章的范本。

- 检查是否完全符合 research-first 流程
- 修正任何残留的 business jargon 或空评价词
- 确认示例页码/链接真实
- 同步更新英文版
- `pnpm build`
- commit

### Stage 4 — 统一检查与收尾
- 运行 business jargon 全局扫描
- 检查所有 frontmatter 字段完整
- 检查 issue 编号无冲突
- 检查内部链接（系列、上下篇、标签页）
- 最终 `pnpm build`
- 生成变更摘要
- 提交最终 commit

---

## 四、质量标准

每篇文章必须满足：

### 内容
- [ ] 开头说明所属系列和读者预期
- [ ] 有明确的"你要解决什么问题"段落
- [ ] 有可执行步骤或可复制模板
- [ ] 所有论文/工具/命令引用真实可验证
- [ ] 有"常见错误"或"边界与局限"部分
- [ ] 结尾有"下一步"（链接到系列内相关文章）

### 语言
- [ ] 无 business/运营黑话（抓手、闭环、赋能、沉淀等）
- [ ] 中英文术语一致
- [ ] 中文与英文/数字之间保留空格
- [ ] 代码块带语言标签
- [ ] 一个段落只讲一个点

### 元数据
- [ ] frontmatter 完整
- [ ] issue 编号符合 `EA-YYYY-MM-NNN`
- [ ] 系列和 seriesOrder 正确
- [ ] 封面图路径存在（必要时重新生成）
- [ ] 标签 ≥ 3 个

---

## 五、关键决策（需用户确认）

1. **英文版策略**
   - [x] B. 全部中文写完后再统一翻译

2. **命令验证级别**
   - [x] B. 主要验证命令格式和路径，不实际跑 GUI 工具

3. **封面图处理**
   - [x] B. 只补充缺失/损坏的，保留现有的

4. **执行方式**
   - [x] A. 用 subagent-driven-development 分任务并行执行

5. **是否允许我直接开始？**
   - [x] 确认计划，开始 Stage 1

---

## 六、风险与应对

| 风险 | 应对 |
|---|---|
| 单篇工作量被低估 | 每篇先输出引用清单+大纲，用户确认后再写 |
| 命令/工具已更新 | 每篇以官方文档为准，旧命令明确标注版本 |
| 英文版质量下降 | 不是直译，是 rewrite for researchers |
| build 被某篇改动破坏 | 每阶段结束 build，问题立即修复 |
| 用户中途调整方向 | 计划已分阶段，调整只影响后续阶段 |

---

## 七、时间估算

| 阶段 | 预计耗时 |
|---|---|
| Stage 1（5 篇短文） | 2–3 天 |
| Stage 2（4 篇教程） | 4–6 天 |
| Stage 3（模板打磨） | 0.5 天 |
| Stage 4（统一检查） | 0.5 天 |
| **总计** | **7–10 天** |

> 以上为连续工作估算。实际节奏由用户确认频率决定。
