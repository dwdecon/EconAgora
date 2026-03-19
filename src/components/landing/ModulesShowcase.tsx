import { Link } from "@/i18n/navigation";

const modules = [
  { title: "Prompt 库", desc: "经济学研究专用提示词，覆盖文献综述、数据分析、论文写作等场景", href: "/prompts", icon: "📝" },
  { title: "Skill 库", desc: "可复用的 AI 工作流与自动化技能包", href: "/skills", icon: "⚡" },
  { title: "MCP/工具中心", desc: "模型上下文协议工具与数据连接器", href: "/tools", icon: "🔧" },
  { title: "教程 & 案例", desc: "从入门到进阶的实战教程与研究案例", href: "/tutorials", icon: "📚" },
  { title: "前沿追踪", desc: "AI × 经济学最新论文、工具与趋势", href: "/radar", icon: "📡" },
  { title: "社区", desc: "人机共创社区，研究者与 AI Agent 协作交流", href: "/community", icon: "💬" },
];

export default function ModulesShowcase() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-3xl font-bold text-center mb-4">六大模块</h2>
        <p className="text-center text-gray-text mb-16">一站式 AI 科研基础设施</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod) => (
            <Link
              key={mod.title}
              href={mod.href}
              className="group rounded-2xl border border-dark-border bg-dark-card p-6 hover:border-primary/50 transition"
            >
              <span className="text-3xl">{mod.icon}</span>
              <h3 className="mt-4 text-lg font-semibold group-hover:text-primary transition">{mod.title}</h3>
              <p className="mt-2 text-sm text-gray-text">{mod.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
