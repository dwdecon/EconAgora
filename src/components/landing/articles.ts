/**
 * Static article content for ModulesShowcase cards.
 * Keyed by slug → locale → HTML string rendered inside .prose-article.
 */

type ArticleMap = Record<string, Record<"zh" | "en", string>>;

export const articles: ArticleMap = {
  /* ── Prompts tab ─────────────────────────────────────── */

  "academic-writing-assistant": {
    zh: `<h2>学术写作助手</h2>
<p>从文献综述到论文润色的完整提示词工作流，帮助研究者在写作的每个阶段获得 AI 辅助。</p>
<h3>核心能力</h3>
<ul>
  <li><strong>文献综述生成</strong> — 输入研究主题，自动生成结构化的文献综述框架，包含关键论点梳理与研究空白识别。</li>
  <li><strong>论文结构优化</strong> — 分析现有草稿的逻辑结构，提供段落重组、论证强化与过渡句建议。</li>
  <li><strong>学术语言润色</strong> — 将口语化表达转换为符合期刊规范的学术英语，保持原意的同时提升表达精准度。</li>
  <li><strong>摘要与引言撰写</strong> — 基于全文内容自动提炼摘要要点，生成符合目标期刊风格的引言段落。</li>
</ul>
<h3>使用场景</h3>
<p>适用于经济学论文写作的全流程：从初期的文献调研、中期的实证分析描述，到后期的语言润色与格式调整。支持 AER、QJE、Econometrica 等主流期刊的写作风格适配。</p>
<blockquote><p>提示：将此模板与「实证结果解读器」配合使用，可以快速将回归结果转化为论文中的叙述段落。</p></blockquote>`,

    en: `<h2>Academic Writing Assistant</h2>
<p>An end-to-end prompt workflow from literature review to paper polishing, giving researchers AI support at every stage of writing.</p>
<h3>Core Capabilities</h3>
<ul>
  <li><strong>Literature review generation</strong> — Enter a research topic to auto-generate a structured review framework with key argument mapping and gap identification.</li>
  <li><strong>Paper structure optimization</strong> — Analyze draft logic, suggest paragraph reorganization, argument strengthening, and transition improvements.</li>
  <li><strong>Academic language polishing</strong> — Convert informal expressions into journal-standard academic English while preserving original meaning.</li>
  <li><strong>Abstract &amp; introduction drafting</strong> — Extract key points from the full text and generate introductions matching target journal style.</li>
</ul>
<h3>Use Cases</h3>
<p>Covers the full lifecycle of economics paper writing: from early literature surveys, mid-stage empirical analysis descriptions, to final language polishing and formatting. Supports style adaptation for AER, QJE, Econometrica, and other major journals.</p>
<blockquote><p>Tip: Pair this template with the "Empirical Results Interpreter" to quickly turn regression outputs into narrative paragraphs.</p></blockquote>`,
  },

  "identification-strategy-generator": {
    zh: `<h2>识别策略生成器</h2>
<p>基于研究问题自动推荐因果推断方法与数据需求，帮助研究者快速确定最合适的实证策略。</p>
<h3>核心能力</h3>
<ul>
  <li><strong>方法匹配</strong> — 输入研究问题与数据特征，自动推荐 DID、RDD、IV、合成控制法等适用方法。</li>
  <li><strong>假设检验清单</strong> — 为每种推荐方法生成需要验证的核心假设列表及对应的检验方式。</li>
  <li><strong>数据需求分析</strong> — 明确所需变量、样本量要求、时间跨度等数据规格。</li>
  <li><strong>替代策略建议</strong> — 当首选方法不可行时，提供备选识别策略及其权衡分析。</li>
</ul>
<h3>使用场景</h3>
<p>特别适合研究设计初期阶段，帮助博士生和青年学者在选题后快速锁定可行的因果推断路径。也适用于审稿过程中评估论文识别策略的合理性。</p>`,

    en: `<h2>Identification Strategy Generator</h2>
<p>Auto-recommend causal inference methods and data requirements based on your research question, helping researchers quickly determine the best empirical strategy.</p>
<h3>Core Capabilities</h3>
<ul>
  <li><strong>Method matching</strong> — Input your research question and data characteristics to get recommendations for DID, RDD, IV, synthetic control, and more.</li>
  <li><strong>Assumption checklist</strong> — Generate a list of core assumptions to verify for each recommended method, with corresponding test procedures.</li>
  <li><strong>Data requirements analysis</strong> — Specify required variables, sample size needs, time spans, and other data specifications.</li>
  <li><strong>Alternative strategy suggestions</strong> — When the preferred method is infeasible, provide backup identification strategies with trade-off analysis.</li>
</ul>
<h3>Use Cases</h3>
<p>Especially useful in the early research design phase, helping PhD students and junior scholars quickly identify feasible causal inference paths after choosing a topic. Also useful for evaluating identification strategy soundness during peer review.</p>`,
  },

  "referee-report-reply": {
    zh: `<h2>审稿意见回复模板</h2>
<p>结构化生成逐条回复，自动对照修改说明与原文差异，让 R&amp;R 过程更高效。</p>
<h3>核心能力</h3>
<ul>
  <li><strong>意见解析</strong> — 自动将审稿报告拆分为独立的意见条目，识别主要关切与次要建议。</li>
  <li><strong>回复框架生成</strong> — 为每条意见生成「感谢 → 回应 → 修改说明」的标准回复结构。</li>
  <li><strong>修改追踪</strong> — 自动标注论文中对应的修改位置，生成 before/after 对比文本。</li>
  <li><strong>语气校准</strong> — 确保回复措辞专业、礼貌且有说服力，避免防御性语言。</li>
</ul>
<h3>使用场景</h3>
<p>收到 R&amp;R 决定后，将审稿报告粘贴到模板中，即可生成结构化的回复草稿。支持多轮审稿的累积追踪。</p>`,

    en: `<h2>Referee Report Reply Template</h2>
<p>Generate structured point-by-point responses with tracked changes against the original, making the R&amp;R process more efficient.</p>
<h3>Core Capabilities</h3>
<ul>
  <li><strong>Comment parsing</strong> — Automatically split referee reports into individual comment items, identifying major concerns and minor suggestions.</li>
  <li><strong>Reply framework generation</strong> — Generate a standard "thank → respond → describe changes" structure for each comment.</li>
  <li><strong>Change tracking</strong> — Auto-annotate corresponding modification locations in the paper with before/after comparison text.</li>
  <li><strong>Tone calibration</strong> — Ensure reply wording is professional, courteous, and persuasive, avoiding defensive language.</li>
</ul>
<h3>Use Cases</h3>
<p>After receiving an R&amp;R decision, paste the referee report into the template to generate a structured reply draft. Supports cumulative tracking across multiple review rounds.</p>`,
  },

  "empirical-results-interpreter": {
    zh: `<h2>实证结果解读器</h2>
<p>将回归表格转化为可读的经济学直觉叙述，弥合统计输出与学术写作之间的鸿沟。</p>
<h3>核心能力</h3>
<ul>
  <li><strong>系数解读</strong> — 将回归系数转化为经济学含义的自然语言描述，包含边际效应与弹性解释。</li>
  <li><strong>显著性叙述</strong> — 用学术规范的方式描述统计显著性，避免 p-hacking 式的过度解读。</li>
  <li><strong>稳健性总结</strong> — 综合多个模型规格的结果，生成一致性与差异性的总结段落。</li>
  <li><strong>图表描述</strong> — 为回归结果图、系数图等生成规范的图表说明文字。</li>
</ul>
<h3>使用场景</h3>
<p>在完成 Stata/R/Python 的回归分析后，将输出结果粘贴到解读器中，即可获得可直接用于论文的叙述段落。</p>`,

    en: `<h2>Empirical Results Interpreter</h2>
<p>Turn regression tables into readable economic intuition narratives, bridging the gap between statistical output and academic writing.</p>
<h3>Core Capabilities</h3>
<ul>
  <li><strong>Coefficient interpretation</strong> — Convert regression coefficients into natural language with economic meaning, including marginal effects and elasticity explanations.</li>
  <li><strong>Significance narration</strong> — Describe statistical significance in academically appropriate ways, avoiding p-hacking-style over-interpretation.</li>
  <li><strong>Robustness summary</strong> — Synthesize results across multiple model specifications into consistency and divergence summary paragraphs.</li>
  <li><strong>Chart descriptions</strong> — Generate standard figure captions for regression result plots, coefficient plots, and more.</li>
</ul>
<h3>Use Cases</h3>
<p>After completing regression analysis in Stata/R/Python, paste the output into the interpreter to get narrative paragraphs ready for your paper.</p>`,
  },

  /* ── Skills tab ──────────────────────────────────────── */

  "literature-search-workflow": {
    zh: `<h2>文献检索工作流</h2>
<p>自动化文献筛选、摘要提取与引用网络分析，将数小时的手动检索压缩为分钟级操作。</p>
<h3>核心能力</h3>
<ul>
  <li><strong>多源检索</strong> — 同时查询 Google Scholar、SSRN、NBER、RePEc 等数据库，去重并统一格式。</li>
  <li><strong>智能筛选</strong> — 基于研究问题的语义相关性自动排序，标注高引用、高相关论文。</li>
  <li><strong>摘要提取与分类</strong> — 批量提取摘要并按方法论、研究对象、时间段等维度自动分类。</li>
  <li><strong>引用网络可视化</strong> — 生成论文间的引用关系图谱，识别核心文献与研究脉络。</li>
</ul>
<h3>使用场景</h3>
<p>适用于开题阶段的系统性文献综述、研究空白识别，以及持续追踪特定领域的最新发表。</p>`,

    en: `<h2>Literature Search Workflow</h2>
<p>Automated paper screening, abstract extraction, and citation network analysis — compressing hours of manual searching into minutes.</p>
<h3>Core Capabilities</h3>
<ul>
  <li><strong>Multi-source retrieval</strong> — Query Google Scholar, SSRN, NBER, RePEc, and more simultaneously with deduplication and unified formatting.</li>
  <li><strong>Smart filtering</strong> — Auto-rank by semantic relevance to your research question, flagging high-citation and high-relevance papers.</li>
  <li><strong>Abstract extraction &amp; classification</strong> — Batch-extract abstracts and auto-categorize by methodology, subject, time period, and more.</li>
  <li><strong>Citation network visualization</strong> — Generate citation relationship graphs to identify core literature and research lineages.</li>
</ul>
<h3>Use Cases</h3>
<p>Ideal for systematic literature reviews during the proposal stage, research gap identification, and ongoing tracking of new publications in specific fields.</p>`,
  },

  "data-cleaning-pipeline": {
    zh: `<h2>数据清洗流水线</h2>
<p>从原始数据到分析就绪数据集的标准化处理流程，减少重复劳动并确保可复现性。</p>
<h3>核心能力</h3>
<ul>
  <li><strong>缺失值诊断</strong> — 自动检测缺失模式（MCAR/MAR/MNAR），推荐对应的处理策略。</li>
  <li><strong>异常值识别</strong> — 基于统计方法与领域知识标记潜在异常值，生成处理建议。</li>
  <li><strong>变量标准化</strong> — 统一编码格式、日期格式、货币单位等，生成标准化的变量字典。</li>
  <li><strong>合并与匹配</strong> — 支持多数据源的模糊匹配与精确合并，自动记录匹配率与丢失情况。</li>
</ul>
<h3>使用场景</h3>
<p>处理 CFPS、CHIP、CHNS 等大型微观调查数据，或合并多年份面板数据时特别有用。</p>`,

    en: `<h2>Data Cleaning Pipeline</h2>
<p>Standardized processing from raw data to analysis-ready datasets, reducing repetitive work and ensuring reproducibility.</p>
<h3>Core Capabilities</h3>
<ul>
  <li><strong>Missing value diagnosis</strong> — Auto-detect missing patterns (MCAR/MAR/MNAR) and recommend corresponding handling strategies.</li>
  <li><strong>Outlier identification</strong> — Flag potential outliers using statistical methods and domain knowledge, with treatment suggestions.</li>
  <li><strong>Variable standardization</strong> — Unify encoding formats, date formats, currency units, and generate standardized variable dictionaries.</li>
  <li><strong>Merge &amp; matching</strong> — Support fuzzy and exact matching across multiple data sources with automatic match rate and loss reporting.</li>
</ul>
<h3>Use Cases</h3>
<p>Especially useful when processing large micro-survey datasets like CFPS, CHIP, CHNS, or merging multi-year panel data.</p>`,
  },

  "variable-construction-engine": {
    zh: `<h2>变量构造引擎</h2>
<p>根据研究设计自动生成交互项、滞后项与工具变量，加速从数据到模型的转化过程。</p>
<h3>核心能力</h3>
<ul>
  <li><strong>交互项生成</strong> — 基于理论假设自动构造二阶、三阶交互项，并生成对应的边际效应计算代码。</li>
  <li><strong>滞后与差分</strong> — 为面板数据自动生成多阶滞后项、一阶差分与长差分变量。</li>
  <li><strong>工具变量建议</strong> — 基于文献中常用的 IV 策略，推荐潜在的工具变量并评估相关性。</li>
  <li><strong>代码输出</strong> — 直接生成 Stata/R/Python 代码片段，可复制粘贴到分析脚本中。</li>
</ul>
<h3>使用场景</h3>
<p>在确定识别策略后，快速构造所需的分析变量，避免手动编码的错误与低效。</p>`,

    en: `<h2>Variable Construction Engine</h2>
<p>Auto-generate interaction terms, lags, and instrumental variables from your research design, accelerating the data-to-model pipeline.</p>
<h3>Core Capabilities</h3>
<ul>
  <li><strong>Interaction term generation</strong> — Auto-construct two-way and three-way interactions based on theoretical hypotheses, with marginal effect calculation code.</li>
  <li><strong>Lags &amp; differences</strong> — Auto-generate multi-order lags, first differences, and long differences for panel data.</li>
  <li><strong>Instrumental variable suggestions</strong> — Recommend potential IVs based on commonly used strategies in the literature, with relevance assessment.</li>
  <li><strong>Code output</strong> — Generate Stata/R/Python code snippets ready to paste into your analysis scripts.</li>
</ul>
<h3>Use Cases</h3>
<p>After determining your identification strategy, quickly construct the required analysis variables, avoiding manual coding errors and inefficiency.</p>`,
  },

  "robustness-check-suite": {
    zh: `<h2>稳健性检验套件</h2>
<p>一键运行安慰剂检验、子样本分析与替代指标验证，系统化地检验实证结果的可靠性。</p>
<h3>核心能力</h3>
<ul>
  <li><strong>安慰剂检验</strong> — 自动生成时间安慰剂、空间安慰剂与随机化推断检验的完整代码。</li>
  <li><strong>子样本分析</strong> — 按预设维度（地区、时间、群体）自动拆分样本并重新估计。</li>
  <li><strong>替代指标验证</strong> — 使用替代因变量和自变量重新运行核心回归，检验结果敏感性。</li>
  <li><strong>结果汇总</strong> — 将所有稳健性检验结果整理为标准化的表格与叙述，可直接用于论文附录。</li>
</ul>
<h3>使用场景</h3>
<p>在完成主回归后，系统性地运行全套稳健性检验，满足顶刊审稿要求。</p>`,

    en: `<h2>Robustness Check Suite</h2>
<p>One-click placebo tests, subsample analysis, and alternative measure validation — systematically testing the reliability of empirical results.</p>
<h3>Core Capabilities</h3>
<ul>
  <li><strong>Placebo tests</strong> — Auto-generate complete code for temporal placebos, spatial placebos, and randomization inference tests.</li>
  <li><strong>Subsample analysis</strong> — Auto-split samples by preset dimensions (region, time, group) and re-estimate.</li>
  <li><strong>Alternative measure validation</strong> — Re-run core regressions with alternative dependent and independent variables to test result sensitivity.</li>
  <li><strong>Results summary</strong> — Compile all robustness check results into standardized tables and narratives ready for paper appendices.</li>
</ul>
<h3>Use Cases</h3>
<p>After completing main regressions, systematically run the full suite of robustness checks to meet top journal review requirements.</p>`,
  },

  /* ── Tools tab ─────────────────────────────────────── */

  "mcp-tool-integration": {
    zh: `<h2>MCP 工具集成</h2>
<p>连接本地文件系统、数据库与外部 API 的统一接口，让 AI 助手真正融入你的研究工作流。</p>
<h3>核心能力</h3>
<ul>
  <li><strong>文件系统访问</strong> — 让 AI 直接读取本地数据文件、代码脚本与文档，无需手动复制粘贴。</li>
  <li><strong>数据库连接</strong> — 通过 MCP 协议安全连接 PostgreSQL、MySQL 等数据库，支持查询与分析。</li>
  <li><strong>API 编排</strong> — 将多个外部 API（学术搜索、数据源、计算服务）串联为自动化工作流。</li>
  <li><strong>工具发现</strong> — 浏览社区贡献的 MCP 工具集合，一键安装并集成到你的环境中。</li>
</ul>
<h3>使用场景</h3>
<p>当你需要 AI 助手直接操作本地文件、查询数据库或调用外部服务时，MCP 工具集成提供了标准化的解决方案。</p>`,

    en: `<h2>MCP Tool Integration</h2>
<p>A unified interface connecting local file systems, databases, and external APIs, letting AI assistants truly integrate into your research workflow.</p>
<h3>Core Capabilities</h3>
<ul>
  <li><strong>File system access</strong> — Let AI directly read local data files, code scripts, and documents without manual copy-paste.</li>
  <li><strong>Database connections</strong> — Securely connect to PostgreSQL, MySQL, and more via MCP protocol for querying and analysis.</li>
  <li><strong>API orchestration</strong> — Chain multiple external APIs (academic search, data sources, compute services) into automated workflows.</li>
  <li><strong>Tool discovery</strong> — Browse community-contributed MCP tool collections and install them into your environment with one click.</li>
</ul>
<h3>Use Cases</h3>
<p>When you need AI assistants to directly manipulate local files, query databases, or call external services, MCP tool integration provides a standardized solution.</p>`,
  },

  "code-replication-environment": {
    zh: `<h2>代码复现环境</h2>
<p>一键配置 Python/R 环境，复现论文中的实证结果，降低复现门槛。</p>
<h3>核心能力</h3>
<ul>
  <li><strong>环境快照</strong> — 自动检测并记录依赖版本，生成可复现的环境配置文件。</li>
  <li><strong>数据获取</strong> — 自动下载论文附带的公开数据集，或指引获取受限数据的申请流程。</li>
  <li><strong>代码适配</strong> — 将 Stata do-file 转换为 Python/R 等效代码，或反向转换。</li>
  <li><strong>结果比对</strong> — 自动比较复现结果与原文表格，标注差异并分析可能原因。</li>
</ul>
<h3>使用场景</h3>
<p>在阅读论文后快速复现其核心结果，用于学习方法论、验证结论或在此基础上扩展研究。</p>`,

    en: `<h2>Code Replication Environment</h2>
<p>One-click Python/R environment setup to replicate empirical results from papers, lowering the replication barrier.</p>
<h3>Core Capabilities</h3>
<ul>
  <li><strong>Environment snapshots</strong> — Auto-detect and record dependency versions, generating reproducible environment config files.</li>
  <li><strong>Data acquisition</strong> — Auto-download publicly available datasets from papers, or guide through restricted data application processes.</li>
  <li><strong>Code adaptation</strong> — Convert Stata do-files to Python/R equivalents, or vice versa.</li>
  <li><strong>Result comparison</strong> — Auto-compare replicated results against original paper tables, flagging differences with possible explanations.</li>
</ul>
<h3>Use Cases</h3>
<p>Quickly replicate core results after reading a paper — for learning methodology, verifying conclusions, or extending the research.</p>`,
  },

  "data-visualization-workshop": {
    zh: `<h2>数据可视化工坊</h2>
<p>交互式图表生成，支持 Matplotlib、ggplot2 与 ECharts，让数据讲述清晰的故事。</p>
<h3>核心能力</h3>
<ul>
  <li><strong>模板库</strong> — 提供经济学论文常用的图表模板：系数图、事件研究图、核密度图、地理热力图等。</li>
  <li><strong>交互式编辑</strong> — 通过自然语言描述调整图表样式、颜色、标注与布局。</li>
  <li><strong>多格式导出</strong> — 支持 PDF、SVG、PNG 等格式导出，满足不同期刊的投稿要求。</li>
  <li><strong>代码生成</strong> — 每张图表都附带完整的 Python/R 代码，方便后续修改与复用。</li>
</ul>
<h3>使用场景</h3>
<p>在论文写作中快速生成出版级质量的图表，或为演示文稿制作数据可视化。</p>`,

    en: `<h2>Data Visualization Workshop</h2>
<p>Interactive chart generation with Matplotlib, ggplot2, and ECharts support — letting data tell a clear story.</p>
<h3>Core Capabilities</h3>
<ul>
  <li><strong>Template library</strong> — Common economics paper chart templates: coefficient plots, event study plots, kernel density plots, geographic heatmaps, and more.</li>
  <li><strong>Interactive editing</strong> — Adjust chart styles, colors, annotations, and layouts through natural language descriptions.</li>
  <li><strong>Multi-format export</strong> — Export to PDF, SVG, PNG, and more to meet different journal submission requirements.</li>
  <li><strong>Code generation</strong> — Every chart comes with complete Python/R code for easy modification and reuse.</li>
</ul>
<h3>Use Cases</h3>
<p>Quickly generate publication-quality charts during paper writing, or create data visualizations for presentations.</p>`,
  },

  "latex-typesetting-assistant": {
    zh: `<h2>LaTeX 排版助手</h2>
<p>论文模板管理、公式渲染与参考文献自动格式化，让排版不再成为写作的障碍。</p>
<h3>核心能力</h3>
<ul>
  <li><strong>模板管理</strong> — 内置 AER、QJE、JFE 等主流期刊的 LaTeX 模板，一键切换格式。</li>
  <li><strong>公式辅助</strong> — 用自然语言描述数学表达式，自动生成对应的 LaTeX 公式代码。</li>
  <li><strong>参考文献</strong> — 自动从 DOI 或标题生成 BibTeX 条目，支持多种引用格式。</li>
  <li><strong>表格生成</strong> — 将 Stata/R 回归输出直接转换为 LaTeX 表格代码。</li>
</ul>
<h3>使用场景</h3>
<p>从论文初稿到最终投稿的排版全流程，特别适合不熟悉 LaTeX 的研究者快速上手。</p>`,

    en: `<h2>LaTeX Typesetting Assistant</h2>
<p>Paper template management, formula rendering, and automated bibliography formatting — removing typesetting as a writing barrier.</p>
<h3>Core Capabilities</h3>
<ul>
  <li><strong>Template management</strong> — Built-in LaTeX templates for AER, QJE, JFE, and other major journals with one-click format switching.</li>
  <li><strong>Formula assistance</strong> — Describe mathematical expressions in natural language and auto-generate corresponding LaTeX formula code.</li>
  <li><strong>Bibliography</strong> — Auto-generate BibTeX entries from DOIs or titles, supporting multiple citation formats.</li>
  <li><strong>Table generation</strong> — Convert Stata/R regression output directly into LaTeX table code.</li>
</ul>
<h3>Use Cases</h3>
<p>Full typesetting workflow from first draft to final submission, especially helpful for researchers new to LaTeX.</p>`,
  },

  /* ── Community tab ────────────────────────────────────── */

  "methodology-discussions": {
    zh: `<h2>方法论讨论</h2>
<p>围绕 DID、RDD、IV 等方法展开的社区讨论与经验分享，让方法论学习不再孤独。</p>
<h3>讨论主题</h3>
<ul>
  <li><strong>方法选择</strong> — 在具体研究场景下，如何选择最合适的因果推断方法？社区成员分享真实案例与决策过程。</li>
  <li><strong>实现细节</strong> — Stata/R/Python 中的具体实现技巧、常见陷阱与最佳实践。</li>
  <li><strong>前沿方法</strong> — 追踪 DID 新进展（Callaway-Sant'Anna、Sun-Abraham 等）、机器学习因果推断等前沿话题。</li>
  <li><strong>审稿经验</strong> — 分享审稿人对方法论部分的常见质疑及有效回应策略。</li>
</ul>
<h3>参与方式</h3>
<p>浏览现有讨论串，或发起新话题分享你的方法论困惑与心得。社区鼓励附带代码与数据的实质性讨论。</p>`,

    en: `<h2>Methodology Discussions</h2>
<p>Community discussions and experience sharing around DID, RDD, IV, and more — making methodology learning a collaborative experience.</p>
<h3>Discussion Topics</h3>
<ul>
  <li><strong>Method selection</strong> — How to choose the most appropriate causal inference method for specific research scenarios? Members share real cases and decision processes.</li>
  <li><strong>Implementation details</strong> — Specific implementation tips, common pitfalls, and best practices in Stata/R/Python.</li>
  <li><strong>Frontier methods</strong> — Track new DID developments (Callaway-Sant'Anna, Sun-Abraham, etc.), ML causal inference, and other cutting-edge topics.</li>
  <li><strong>Review experience</strong> — Share common referee concerns about methodology sections and effective response strategies.</li>
</ul>
<h3>How to Participate</h3>
<p>Browse existing discussion threads or start a new topic to share your methodology questions and insights. The community encourages substantive discussions with code and data.</p>`,
  },

  "paper-replication-challenges": {
    zh: `<h2>论文复现挑战</h2>
<p>社区驱动的论文复现项目，协作验证研究结果，推动开放科学实践。</p>
<h3>项目形式</h3>
<ul>
  <li><strong>月度挑战</strong> — 每月选定一篇有影响力的论文，社区成员协作复现其核心结果。</li>
  <li><strong>复现报告</strong> — 记录复现过程中的发现、差异与改进建议，形成公开的复现报告。</li>
  <li><strong>代码共享</strong> — 所有复现代码开源共享，建立可复用的分析代码库。</li>
  <li><strong>方法学习</strong> — 通过复现过程深入理解论文的方法论细节与实现技巧。</li>
</ul>
<h3>参与方式</h3>
<p>加入当前进行中的复现项目，或提名你希望社区复现的论文。</p>`,

    en: `<h2>Paper Replication Challenges</h2>
<p>Community-driven replication projects to collaboratively verify research results and advance open science practices.</p>
<h3>Project Format</h3>
<ul>
  <li><strong>Monthly challenges</strong> — Each month, select an influential paper for community members to collaboratively replicate core results.</li>
  <li><strong>Replication reports</strong> — Document findings, discrepancies, and improvement suggestions during replication, forming public replication reports.</li>
  <li><strong>Code sharing</strong> — All replication code is open-sourced, building a reusable analysis code library.</li>
  <li><strong>Method learning</strong> — Deeply understand methodology details and implementation techniques through the replication process.</li>
</ul>
<h3>How to Participate</h3>
<p>Join an ongoing replication project or nominate a paper you'd like the community to replicate.</p>`,
  },

  "dataset-sharing": {
    zh: `<h2>数据集共享</h2>
<p>社区成员整理的高质量公开数据集与使用指南，降低数据获取门槛。</p>
<h3>数据资源</h3>
<ul>
  <li><strong>数据目录</strong> — 按研究领域分类的公开数据集索引，包含数据描述、获取方式与使用限制。</li>
  <li><strong>清洗脚本</strong> — 社区贡献的数据清洗与预处理代码，可直接复用。</li>
  <li><strong>使用指南</strong> — 详细的数据集使用教程，包含变量说明、抽样设计与常见问题。</li>
  <li><strong>更新追踪</strong> — 追踪数据集的版本更新与新增年份，及时获取最新数据。</li>
</ul>
<h3>参与方式</h3>
<p>分享你整理的数据集信息与清洗代码，或为现有数据集补充使用经验与注意事项。</p>`,

    en: `<h2>Dataset Sharing</h2>
<p>Curated open datasets and usage guides contributed by community members, lowering the data acquisition barrier.</p>
<h3>Data Resources</h3>
<ul>
  <li><strong>Data catalog</strong> — Open dataset index categorized by research field, with descriptions, access methods, and usage restrictions.</li>
  <li><strong>Cleaning scripts</strong> — Community-contributed data cleaning and preprocessing code, ready for reuse.</li>
  <li><strong>Usage guides</strong> — Detailed dataset tutorials including variable descriptions, sampling design, and common issues.</li>
  <li><strong>Update tracking</strong> — Track dataset version updates and new year additions to get the latest data promptly.</li>
</ul>
<h3>How to Participate</h3>
<p>Share your curated dataset information and cleaning code, or add usage tips and caveats for existing datasets.</p>`,
  },

  "job-market-careers": {
    zh: `<h2>求职与学术市场</h2>
<p>经济学 Job Market 信息汇总、面试经验与申请材料互评，助力学术求职。</p>
<h3>核心内容</h3>
<ul>
  <li><strong>职位信息</strong> — 汇总全球经济学教职、博后与研究岗位的招聘信息。</li>
  <li><strong>申请指南</strong> — Job Market Paper 写作建议、求职信模板与教学陈述范例。</li>
  <li><strong>面试准备</strong> — 分享 flyout 面试经验、Job Talk 技巧与常见问题应对策略。</li>
  <li><strong>材料互评</strong> — 社区成员互相审阅 CV、求职信与研究陈述，提供改进建议。</li>
</ul>
<h3>参与方式</h3>
<p>分享你的求职经验，或寻求社区对申请材料的反馈。所有讨论均可匿名参与。</p>`,

    en: `<h2>Job Market &amp; Careers</h2>
<p>Econ job market info aggregation, interview tips, and peer review of application materials to support academic job searches.</p>
<h3>Core Content</h3>
<ul>
  <li><strong>Job listings</strong> — Aggregated global economics faculty, postdoc, and research position openings.</li>
  <li><strong>Application guides</strong> — Job Market Paper writing advice, cover letter templates, and teaching statement examples.</li>
  <li><strong>Interview prep</strong> — Shared flyout interview experiences, Job Talk tips, and common question response strategies.</li>
  <li><strong>Material peer review</strong> — Community members review each other's CVs, cover letters, and research statements with improvement suggestions.</li>
</ul>
<h3>How to Participate</h3>
<p>Share your job search experience or seek community feedback on application materials. All discussions support anonymous participation.</p>`,
  },

  /* ── Broadcast tab ───────────────────────────────────── */

  "weekly-research-digest": {
    zh: `<h2>每周研究速递</h2>
<p>AI 辅助筛选的本周重要论文、数据集与工具更新，让你不错过领域内的关键进展。</p>
<h3>内容板块</h3>
<ul>
  <li><strong>论文精选</strong> — 本周发布的高影响力 Working Paper 与正式发表论文摘要。</li>
  <li><strong>数据更新</strong> — 新发布或更新的公开数据集通知。</li>
  <li><strong>工具动态</strong> — AI 工具、统计软件包与研究平台的重要更新。</li>
  <li><strong>社区亮点</strong> — 本周社区中最活跃的讨论与最有价值的贡献。</li>
</ul>
<h3>订阅方式</h3>
<p>关注 Broadcast 频道即可每周收到推送，也可以按研究方向自定义订阅内容。</p>`,

    en: `<h2>Weekly Research Digest</h2>
<p>AI-curated highlights of important papers, datasets, and tool updates this week — so you never miss key developments in your field.</p>
<h3>Content Sections</h3>
<ul>
  <li><strong>Paper picks</strong> — Summaries of high-impact working papers and newly published articles this week.</li>
  <li><strong>Data updates</strong> — Notifications of newly released or updated open datasets.</li>
  <li><strong>Tool news</strong> — Important updates to AI tools, statistical packages, and research platforms.</li>
  <li><strong>Community highlights</strong> — The most active discussions and valuable contributions from the community this week.</li>
</ul>
<h3>How to Subscribe</h3>
<p>Follow the Broadcast channel for weekly updates, or customize your subscription by research area.</p>`,
  },

  "platform-changelog": {
    zh: `<h2>平台更新日志</h2>
<p>新功能发布、社区里程碑与即将上线的能力预告，保持对平台发展的了解。</p>
<h3>更新类型</h3>
<ul>
  <li><strong>新功能</strong> — 平台新增的工具、模板与集成能力详细介绍。</li>
  <li><strong>改进优化</strong> — 现有功能的性能提升、界面优化与体验改善。</li>
  <li><strong>社区里程碑</strong> — 用户数、内容量、协作项目等关键指标的阶段性成果。</li>
  <li><strong>路线图预告</strong> — 即将开发的功能与长期规划方向。</li>
</ul>
<h3>参与方式</h3>
<p>在更新日志下方留言反馈使用体验，或在 GitHub 上提交功能建议。</p>`,

    en: `<h2>Platform Changelog</h2>
<p>New feature releases, community milestones, and upcoming capability previews — stay informed about platform development.</p>
<h3>Update Types</h3>
<ul>
  <li><strong>New features</strong> — Detailed introductions to newly added tools, templates, and integration capabilities.</li>
  <li><strong>Improvements</strong> — Performance enhancements, UI optimizations, and experience improvements to existing features.</li>
  <li><strong>Community milestones</strong> — Key metric achievements in user count, content volume, and collaborative projects.</li>
  <li><strong>Roadmap previews</strong> — Upcoming features and long-term planning directions.</li>
</ul>
<h3>How to Participate</h3>
<p>Leave feedback under changelog entries or submit feature suggestions on GitHub.</p>`,
  },

  "frontier-tracker": {
    zh: `<h2>领域前沿追踪</h2>
<p>按研究方向订阅的最新 Working Paper 与预印本推送，保持学术前沿敏感度。</p>
<h3>追踪维度</h3>
<ul>
  <li><strong>研究领域</strong> — 按劳动经济学、发展经济学、产业组织等细分领域订阅。</li>
  <li><strong>方法论</strong> — 追踪特定方法（DID、机器学习、结构估计等）的最新应用论文。</li>
  <li><strong>作者关注</strong> — 关注特定学者的新发表与 Working Paper。</li>
  <li><strong>关键词监控</strong> — 设置自定义关键词，自动匹配相关新论文。</li>
</ul>
<h3>使用方式</h3>
<p>在个人设置中配置你的研究兴趣，系统将自动推送匹配的最新论文摘要。</p>`,

    en: `<h2>Frontier Tracker</h2>
<p>Subscribe to latest working papers and preprints by research field — maintaining sensitivity to the academic frontier.</p>
<h3>Tracking Dimensions</h3>
<ul>
  <li><strong>Research fields</strong> — Subscribe by subfield: labor economics, development economics, industrial organization, and more.</li>
  <li><strong>Methodology</strong> — Track latest application papers for specific methods (DID, machine learning, structural estimation, etc.).</li>
  <li><strong>Author following</strong> — Follow specific scholars' new publications and working papers.</li>
  <li><strong>Keyword monitoring</strong> — Set custom keywords to auto-match relevant new papers.</li>
</ul>
<h3>How to Use</h3>
<p>Configure your research interests in personal settings, and the system will auto-push matching latest paper summaries.</p>`,
  },

  "methods-quick-course": {
    zh: `<h2>方法论速成课</h2>
<p>社区专家录制的 10 分钟方法论讲解与代码演示，快速掌握核心概念。</p>
<h3>课程特色</h3>
<ul>
  <li><strong>精炼内容</strong> — 每期聚焦一个方法论要点，10 分钟内讲清核心直觉与实现步骤。</li>
  <li><strong>代码演示</strong> — 配套 Stata/R/Python 代码，可直接下载运行。</li>
  <li><strong>实例驱动</strong> — 基于真实论文案例讲解，而非抽象理论推导。</li>
  <li><strong>社区贡献</strong> — 由活跃的研究者与教师录制，内容持续更新。</li>
</ul>
<h3>参与方式</h3>
<p>浏览已有课程或申请成为讲者，分享你擅长的方法论主题。</p>`,

    en: `<h2>Methods Quick Course</h2>
<p>10-minute methodology explainers and code demos by community experts — quickly grasp core concepts.</p>
<h3>Course Features</h3>
<ul>
  <li><strong>Concise content</strong> — Each episode focuses on one methodology point, covering core intuition and implementation steps in 10 minutes.</li>
  <li><strong>Code demos</strong> — Accompanying Stata/R/Python code available for direct download and execution.</li>
  <li><strong>Example-driven</strong> — Explained through real paper cases rather than abstract theoretical derivations.</li>
  <li><strong>Community-contributed</strong> — Recorded by active researchers and instructors, with continuously updated content.</li>
</ul>
<h3>How to Participate</h3>
<p>Browse existing courses or apply to become a speaker to share your methodology expertise.</p>`,
  },
};
