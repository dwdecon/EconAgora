#!/usr/bin/env python
"""Build the curated payload file for the 16 skills from
pedrohcgs/claude-code-my-workflow (tier 1 + tier 2 selection, David 2026-10-05).

Downloads each SKILL.md raw, strips YAML frontmatter, and emits
ccmw-payload.json: [{payload: {...skill row...}, source_path: "..."}]

Categories mapped to the site's Chinese taxonomy (chinese-taxonomy.md).
Run locally; upload the JSON to the server and insert with the JWT helper
(scripts/curation/insert-rdb.sh pattern) or hand the file to the weekly cron.
"""
import json
import re
import ssl
import sys
import urllib.request
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
REPO = "pedrohcgs/claude-code-my-workflow"
RAW = f"https://raw.githubusercontent.com/{REPO}/main"
OUT = Path(__file__).resolve().parent / "ccmw-payload.json"

# slug -> (title_zh, category, subcategory, workflow_stage, tags)
SEL = {
    # tier 1 — strong econ (13)
    "stata-replication":      ("Stata 复现管线",        "Stata", "计量",   "analysis",  ["Stata", "复现", "MCP", "实证"]),
    "audit-reproducibility":  ("复现审计",              "综合",  "研究流程", "revision",  ["复现", "审计", "数值一致性", "Stata", "R"]),
    "replication-package":    ("复现包组装",            "投稿",  "投稿指南", "revision",  ["AEA", "复现包", "openICPSR", "投稿"]),
    "power-analysis":         ("统计功效分析",          "分析",  "计量",   "planning",  ["功效", "MDE", "RCT", "样本量"]),
    "simulation-study":       ("蒙特卡洛模拟研究",      "分析",  "建模",   "analysis",  ["Monte Carlo", "模拟", "稳健性", "R"]),
    "differential-audit":     ("实现差异审计",          "分析",  "编程",   "analysis",  ["复现", "R", "Stata", "Python", "一致性"]),
    "preregister":            ("研究预注册",            "选题",  "研究规划", "planning",  ["预注册", "OSF", "AEA RCT", "研究设计"]),
    "research-ideation":      ("研究选题生成",          "选题",  "选题评估", "planning",  ["选题", "假设", "实证策略"]),
    "interview-me":           ("研究想法结构化访谈",    "选题",  "研究规划", "planning",  ["选题", "识别策略", "访谈"]),
    "challenge":              ("发现稳健性挑战",        "分析",  "因果推断", "analysis",  ["稳健性", "压力测试", "识别"]),
    "deep-audit":             ("深度对抗审计",          "分析",  "计量",   "analysis",  ["审计", "对抗审查", "理论", "实证"]),
    "diagnose":               ("实证结果诊断",          "数据",  "清洗",   "analysis",  ["调试", "诊断", "实证", "复现"]),
    "capture-environment":    ("计算环境快照",          "综合",  "研究流程", "analysis",  ["环境", "renv", "复现包", "锁文件"]),
    # tier 2 — academic with econ interface (3)
    "respond-to-referees":    ("审稿回复撰写",          "投稿",  "审稿回复", "revision",  ["审稿", "返修", "投稿"]),
    "data-analysis":          ("R 数据分析全流程",      "R",     "计量",   "analysis",  ["R", "回归", "数据清洗", "表格"]),
    "lit-review":             ("结构化文献综述",        "综述",  "文献综述", "literature", ["文献综述", "引文", "主题聚类"]),
}


def strip_frontmatter(txt: str) -> str:
    m = re.match(r"^---\s*\n[\s\S]*?\n---\s*\n?", txt)
    return txt[m.end():].lstrip("\n") if m else txt


def fetch(slug: str) -> str:
    url = f"{RAW}/.claude/skills/{slug}/SKILL.md"
    req = urllib.request.Request(url, headers={"User-Agent": "econagora-curation"})
    with urllib.request.urlopen(req, timeout=30, context=ssl.create_default_context()) as r:
        return r.read().decode("utf-8", "replace")


def main() -> int:
    results, failures = [], []
    for slug, (tzh, cat, sub, stage, tags) in SEL.items():
        try:
            raw = fetch(slug)
            body = strip_frontmatter(raw)
            desc_en = ""
            m = re.search(r"^description:\s*\|?\s*\n?\s*(.+?)(?:\n[a-z_-]+:|$)", raw, re.M | re.S)
            if m:
                desc_en = " ".join(m.group(1).split())[:400]
            payload = {
                "_id": f"{REPO.replace('/', '~')}/{slug}".replace("pedrohcgs~claude-code-my-workflow", "pedrohcgs/claude-code-my-workflow"),
                "title": slug.replace("-", " ").title(),
                "title_zh": tzh,
                "description": desc_en or f"{slug} skill from {REPO}.",
                "description_zh": tzh + f"——来自 {REPO} 的学术工作流技能。",
                "category": cat,
                "subcategory": sub,
                "tags": json.dumps(tags, ensure_ascii=False),
                "platform": "claude-code",
                "workflow_stage": stage,
                "skill_md": body[:45000],
                "source_repo": REPO,
                "source_slug": slug,
                "source_url": f"{RAW}/.claude/skills/{slug}/SKILL.md",
                "status": "PUBLISHED",
                "author_id": "pedrohcgs",
                "author_name": "Pedro H. C. Sant'Anna (pedrohcgs)",
                "view_count": 0,
                "like_count": 0,
            }
            results.append({"slug": slug, "payload": payload, "body_chars": len(body)})
            print(f"OK   {slug:<24} {len(body):>6}c  {cat}/{sub}")
        except Exception as e:
            failures.append({"slug": slug, "error": str(e)[:120]})
            print(f"FAIL {slug}: {e}")
    OUT.write_text(json.dumps(results, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\npayload file: {OUT}")
    print(f"ok={len(results)} fail={len(failures)}")
    if failures:
        print(json.dumps(failures, ensure_ascii=False, indent=1))
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())
