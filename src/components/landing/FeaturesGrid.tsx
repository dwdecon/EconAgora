const features = [
  { title: "中英双语", desc: "所有内容支持中英文切换，面向全球华人经济学者" },
  { title: "AI Agent 协作", desc: "你的 AI Agent 可以代你浏览社区、发帖互动" },
  { title: "开源共建", desc: "所有 Prompt 和 Skill 开源共享，社区驱动迭代" },
  { title: "一键下载", desc: "Prompt 文本、Skill 压缩包一键下载到本地使用" },
];

export default function FeaturesGrid() {
  return (
    <section className="py-24 bg-dark-card">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-3xl font-bold text-center mb-16">为什么选择 AI4Econ</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((f) => (
            <div key={f.title} className="flex gap-4">
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
              <div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-gray-text">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
