const stats = [
  { value: "128+", label: "Prompts" },
  { value: "45+", label: "Skills" },
  { value: "30+", label: "Tools" },
  { value: "500+", label: "研究者" },
];

export default function StatsBar() {
  return (
    <section className="border-y border-dark-border">
      <div className="mx-auto max-w-5xl px-6 py-12 flex justify-center gap-16 md:gap-24">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-3xl font-bold text-primary">{stat.value}</div>
            <div className="mt-1 text-sm text-gray-text">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
