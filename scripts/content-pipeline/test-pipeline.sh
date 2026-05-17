#!/bin/bash
# End-to-end pipeline test
# This script simulates the full content generation workflow

set -e

echo "🧪 EconAgora Content Pipeline - End-to-End Test"
echo "================================================"
echo ""

# Test 1: Fetch topics
echo "📚 Test 1: Fetching arXiv topics..."
npx tsx scripts/content-pipeline/fetch-arxiv.ts 3 > /tmp/arxiv-topics.txt 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Topic fetching works"
    echo "   Sample output:"
    head -5 /tmp/arxiv-topics.txt | sed 's/^/   /'
else
    echo "⚠️  Topic fetching had issues (non-critical for test)"
fi
echo ""

# Test 2: Generate test content files
echo "📝 Test 2: Creating test content files..."

mkdir -p /tmp/test-content

cat > /tmp/test-content/test-zh.md << 'EOF'
## 引言

在经济学研究中，因果推断是最核心的方法论挑战之一。近年来，大型语言模型（LLM）为研究者提供了新的工具，可以辅助识别策略的设计和评估。

## 核心方法

本文介绍如何使用 Claude 和 GPT-4 来辅助设计差分法（DID）的识别策略。

### 步骤一：定义处理组和对比组

首先，我们需要明确研究问题的处理变量和结果变量。LLM 可以帮助我们：

- 识别潜在的处理组定义
- 评估对比组的可比性
- 检查平行趋势假设的合理性

### 步骤二：验证识别假设

使用 LLM 进行以下验证：

1. **平行趋势检验**: 让模型分析政策实施前的趋势是否平行
2. **溢出效应检查**: 评估处理是否可能影响对照组
3. **机制分析**: 探讨处理效应的作用渠道

## 代码示例

```python
import openai

# 定义提示词
prompt = """
请评估以下 DID 设计的识别假设：
处理组：实施最低工资政策的州
对照组：未实施该政策的相邻州
结果变量：就业率
"""

# 调用 LLM
response = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[{"role": "user", "content": prompt}]
)

print(response.choices[0].message.content)
```

## 实践建议

1. **不要完全依赖 LLM**: 将其作为辅助工具，而非替代专业判断
2. **迭代优化**: 根据模型反馈不断调整识别策略
3. **文档记录**: 保存所有与 LLM 的交互记录，确保可复现性

## 总结

LLM 可以作为因果推断研究的有力辅助工具，但研究者仍需保持批判性思维，验证模型建议的合理性。
EOF

cat > /tmp/test-content/test-en.md << 'EOF'
## Introduction

Causal inference is one of the most fundamental methodological challenges in economics research. In recent years, Large Language Models (LLMs) have provided researchers with new tools to assist in the design and evaluation of identification strategies.

## Core Methods

This article introduces how to use Claude and GPT-4 to assist in designing Difference-in-Differences (DID) identification strategies.

### Step 1: Define Treatment and Control Groups

First, we need to clarify the treatment variable and outcome variable for the research question. LLMs can help us:

- Identify potential treatment group definitions
- Assess the comparability of control groups
- Check the plausibility of parallel trends assumptions

### Step 2: Validate Identification Assumptions

Use LLMs for the following validations:

1. **Parallel Trends Test**: Have the model analyze whether trends were parallel before policy implementation
2. **Spillover Effect Check**: Assess whether treatment might affect the control group
3. **Mechanism Analysis**: Explore channels through which treatment effects operate

## Code Example

```python
import openai

# Define prompt
prompt = """
Please evaluate the identification assumptions of the following DID design:
Treatment group: States that implemented minimum wage policy
Control group: Adjacent states that did not implement the policy
Outcome variable: Employment rate
"""

# Call LLM
response = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[{"role": "user", "content": prompt}]
)

print(response.choices[0].message.content)
```

## Practical Recommendations

1. **Don't rely entirely on LLMs**: Use them as auxiliary tools, not replacements for professional judgment
2. **Iterative optimization**: Continuously adjust identification strategies based on model feedback
3. **Documentation**: Save all interaction records with LLMs to ensure reproducibility

## Conclusion

LLMs can serve as powerful auxiliary tools for causal inference research, but researchers must maintain critical thinking and verify the reasonableness of model suggestions.
EOF

echo "✅ Test content files created"
echo ""

# Test 3: Publish
echo "📤 Test 3: Publishing test article..."
npx tsx scripts/content-pipeline/publish.ts \
    --title "使用 LLM 辅助 DID 识别策略设计" \
    --slug "llm-assisted-did-design" \
    --category "因果推断" \
    --tags "LLM,DID,因果推断,工具教程" \
    --zh-content /tmp/test-content/test-zh.md \
    --en-content /tmp/test-content/test-en.md \
    --source "arXiv:2605.xxxxx"

if [ $? -eq 0 ]; then
    echo "✅ Publishing works"
else
    echo "❌ Publishing failed"
    exit 1
fi
echo ""

# Test 4: Verify with blog-loader
echo "🔍 Test 4: Verifying with blog-loader..."
npx tsx -e "
import { loadBlogEntryBySlug, loadBlogEntries } from './src/lib/blog-loader';

const entries = loadBlogEntries('zh');
console.log('Total entries:', entries.length);

const entry = loadBlogEntryBySlug('llm-assisted-did-design', 'zh');
if (entry) {
    console.log('✅ Entry found:', entry.title);
    console.log('   Author:', entry.author);
    console.log('   Tags:', entry.tags);
    console.log('   Content length:', entry.content.length);
} else {
    console.log('❌ Entry not found');
    process.exit(1);
}
"

if [ $? -eq 0 ]; then
    echo "✅ Blog loader verification passed"
else
    echo "❌ Blog loader verification failed"
    exit 1
fi
echo ""

# Test 5: Check file structure
echo "📁 Test 5: Checking file structure..."
ls -la content/blog/llm-assisted-did-design/

echo ""
echo "🎉 All tests passed!"
echo ""
echo "Summary:"
echo "  - Topic fetching: ✅"
echo "  - Content generation: ✅ (simulated)"
echo "  - Publishing: ✅"
echo "  - Blog loader: ✅"
echo ""
echo "Next steps:"
echo "  1. Review the generated content in content/blog/llm-assisted-did-design/"
echo "  2. Test cover image generation (requires API key)"
echo "  3. Commit changes and create PR"
