# Skill Batch Import Pipeline — Spec

## 目标

从多个 GitHub 仓库批量导入 skills 到 EconAgora CloudBase 数据库，支持多种仓库结构，全自动写入，幂等可重跑。

---

## 触发方式

```bash
npx ts-node scripts/skill-import/run.ts --phase=all   # 全流程
npx ts-node scripts/skill-import/run.ts --phase=1     # 只跑 research（需 --input）
npx ts-node scripts/skill-import/run.ts --phase=2     # 只跑 diff（用已有 verified-sources.json）
npx ts-node scripts/skill-import/run.ts --phase=3     # 只跑 import（用已有 pending-import.json）
```

输入文件（phase=1 或 all 时必填）：
```bash
--input "path/to/sources.json"   # 手动整理的仓库清单（见下方格式）
```

---

## 中间文件

所有中间文件存放于 `scripts/skill-import/data/`，不提交 git（加入 .gitignore）。

### `sources.json`（手动维护，输入）

```json
[
  {
    "repo": "dylantmoore/stata-skill",
    "install_command": "/plugin marketplace add dylantmoore/stata-skill\n/plugin install stata"
  },
  {
    "repo": "hanlulong/econ-writing-skill",
    "install_command": "curl -fsSL https://raw.githubusercontent.com/hanlulong/econ-writing-skill/main/install.sh | bash"
  },
  {
    "repo": "fcakyon/phd-skills",
    "install_command": "claude plugin marketplace add fcakyon/phd-skills\nclaude plugin install phd-skills@phd-skills"
  },
  {
    "repo": "jusi-aalto/strategic-revision",
    "install_command": null
  },
  {
    "repo": "lingzhi227/agent-research-skills",
    "install_command": "curl -fsSL https://raw.githubusercontent.com/lingzhi227/agent-research-skills/main/install.sh | bash"
  }
]
```

### `verified-sources.json`（Phase 1 输出）

```json
[
  {
    "repo": "dylantmoore/stata-skill",
    "stars": 192,
    "description": "...",
    "install_command": "...",
    "verified": true
  }
]
```

### `pending-import.json`（Phase 2 输出）

```json
[
  {
    "id": "dylantmoore/stata-skill",
    "repo": "dylantmoore/stata-skill",
    "skill_name": "stata-skill",
    "skill_md_path": "plugins/stata/skills/stata/SKILL.md",
    "source_url": "https://raw.githubusercontent.com/dylantmoore/stata-skill/main/plugins/stata/skills/stata/SKILL.md",
    "install_command": "...",
    "frontmatter": { "name": "stata", "description": "..." }
  }
]
```

### `import-report.json`（Phase 3 输出）

```json
{
  "total": 25,
  "inserted": 23,
  "skipped": 2,
  "errors": []
}
```

---

## Phase 1: RESEARCH

**输入**：`sources.json`
**输出**：`verified-sources.json`

步骤：
1. 读取 `sources.json`
2. 对每个 repo，调用 `https://api.github.com/repos/{repo}` 验证存在性（HTTP 200）
3. 提取 `stargazers_count`、`description`
4. 写入 `verified-sources.json`，404 的 repo 标记 `verified: false` 并跳过后续阶段

---

## Phase 2: DIFF

**输入**：`verified-sources.json`
**输出**：`pending-import.json`

步骤：
1. 查询 CloudBase DB 已有 `skill._id` 列表
2. 对每个 verified repo，调用 GitHub API 获取文件树（`/git/trees/main?recursive=1`）
3. 枚举 SKILL.md 文件（见"文件发现规则"）
4. 生成候选 `_id = repo/skill-slug`（见"_id 生成规则"）
5. 过滤掉已存在的 `_id`
6. 写入 `pending-import.json`

### 文件发现规则

按优先级匹配，找到即停：

| 优先级 | 路径模式 | 说明 |
|--------|----------|------|
| 1 | `skills/*/SKILL.md` | lingzhi 风格 |
| 2 | `plugin/skills/*/SKILL.md` | fcakyon 风格 |
| 3 | `plugins/*/skills/*/SKILL.md` | dylantmoore 风格 |
| 4 | `.claude/skills/*/SKILL.md` | hanlulong 风格 |
| 5 | `*.skill`（ZIP） | jusi-aalto 风格，解压后读内部 SKILL.md |
| 6 | 根目录 `SKILL.md` | 单文件仓库 |

**排除规则**：路径含 `commands/`、`agents/`、`hooks/`、`tests/` 的跳过。

**去重规则**：同一 `name` frontmatter 出现多次（如 `.claude/` 和 `.agents/` 双路径），保留路径深度最浅且含 `.claude/` 的那条。

### _id 生成规则

```
_id = "{owner}/{repo-name}/{skill-name}"
```

`skill-name` 取 SKILL.md frontmatter 的 `name` 字段；无 frontmatter 则取文件夹名。

示例：
- `dylantmoore/stata-skill/stata`
- `fcakyon/phd-skills/reproduce`
- `lingzhi227/agent-research-skills/deep-research`

> 决策（2026-05-03）：三段格式，与现有单段 _id 风格不同，但多仓库场景下唯一性更强。

---

## Phase 3: IMPORT

**输入**：`pending-import.json`
**输出**：`import-report.json` + 写入 CloudBase DB

步骤：
1. 读取 `pending-import.json`
2. 对每条记录，通过 GitHub API 下载 SKILL.md 原文
3. 解析 frontmatter（`name`、`description`、`argument-hint`、`user-invocable`）
4. 映射字段（见"字段映射"）
5. 调用 CloudBase `manageSqlDatabase` 写入，`INSERT IGNORE`（幂等）
6. 写入 `import-report.json`

### 特殊格式处理

- **ZIP（.skill 文件）**：下载二进制，`zipfile` 解压，读内部 `*/SKILL.md`
- **编码**：统一 `errors='replace'`，不依赖 chardet
- **文件获取**：通过 GitHub API（`/contents/{path}`）base64 解码，不用 curl/git clone

### 字段映射

| DB 列 | 来源 | 说明 |
|-------|------|------|
| `_id` | 生成 | `repo/skill-name` |
| `title` | frontmatter `name` | 无则取文件夹名 |
| `description` | frontmatter `description` | |
| `skill_md` | SKILL.md 正文（去掉 frontmatter） | |
| `source_repo` | repo（如 `dylantmoore/stata-skill`） | |
| `source_url` | raw GitHub URL | 直接存，不运行时拼接 |
| `install_command` | `sources.json` 提供 | NULL 表示手动安装 |
| `category` | 见"category 映射" | |
| `workflow_stage` | frontmatter `workflow_stage` 或推断 | |
| `platform` | frontmatter `compatibility` 或 `platform` | |
| `tags` | frontmatter `tags` 或空数组 | JSON 存储 |
| `status` | 固定 `'PUBLISHED'` | |
| `author_id` | 固定 `'imported'` | 导入 skill 统一标识 |
| `like_count` | 固定 `0` | |
| `view_count` | 固定 `0` | |

### category 映射

| repo | category |
|------|----------|
| `dylantmoore/stata-skill` | `data-analysis` |
| `hanlulong/econ-writing-skill` | `writing` |
| `fcakyon/phd-skills` | 按 skill name 推断（见下） |
| `jusi-aalto/strategic-revision` | `writing` |
| `lingzhi227/agent-research-skills` | 按 skill name 推断 |

fcakyon/lingzhi 推断规则：
- 含 `paper`/`writing`/`latex` → `writing`
- 含 `data`/`dataset`/`analysis` → `data-analysis`
- 含 `literature`/`research`/`review` → `literature`
- 含 `reproduce`/`debug`/`code` → `coding`
- 其他 → `research-tools`

---

## DB Schema 变更

在现有 `skill` 表新增两列：

```sql
ALTER TABLE skill ADD COLUMN install_command TEXT NULL;
ALTER TABLE skill ADD COLUMN source_url VARCHAR(1000) NULL;
```

TypeScript 类型（`src/lib/skills.ts`）新增：
```ts
installCommand: string | null;
sourceUrl: string | null;
```

---

## 前端变更（SkillSidebar）

`getSkillDownloadUrl` 函数替换逻辑：

```
当前：只对 meleantonio 仓库拼接 URL
新逻辑：
  1. 有 install_command → 显示"一键安装"区块，内容为 install_command
  2. 无 install_command 但有 source_url → 显示"复制导入提示词"，downloadUrl = source_url
  3. 两者都无 → 隐藏导入区块（现有行为）
```

`buildAgentImportPrompt` 新增分支：
- 有 `install_command`：提示词改为"请运行以下命令安装此 skill：\n{install_command}"
- 有 `source_url`（无 install_command）：保持现有提示词逻辑，downloadUrl = source_url

---

## 文件结构

```
scripts/skill-import/
  run.ts              # 入口，--phase 参数路由
  phases/
    research.ts       # Phase 1
    diff.ts           # Phase 2
    import.ts         # Phase 3
  lib/
    github.ts         # GitHub API 封装（fetch file tree, download file）
    parse-skill.ts    # SKILL.md 解析（frontmatter + 正文，ZIP 支持）
    category-map.ts   # category 推断规则
  data/               # .gitignore 排除
    sources.json      # 手动维护
    verified-sources.json
    pending-import.json
    import-report.json
```

---

## 幂等保证

- Phase 1：每次重跑覆盖 `verified-sources.json`
- Phase 2：每次重跑覆盖 `pending-import.json`，基于 DB 当前状态 diff
- Phase 3：`INSERT IGNORE`，已存在的 `_id` 跳过不报错

---

## 不在范围内

- 自动从 docx 提取仓库列表（Phase 1 输入为手动整理的 `sources.json`）
- references 文件合并入 skill_md
- 自动更新已存在 skill 的内容（只插入，不更新）
