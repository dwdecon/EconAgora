import { getLocale } from "next-intl/server";
import Reveal from "@/components/shared/Reveal";
import { getHomeContent } from "./content";
import { serverDb } from "@/lib/rdb-server";

export default async function StatsBar() {
  const locale = await getLocale();
  const content = getHomeContent(locale);

  // Fetch real counts from DB
  const [prompts, skills, tools, users] = await Promise.all([
    serverDb.from("prompt").select("_id", { count: "exact" }).eq("status", "PUBLISHED").limit(1),
    serverDb.from("skill").select("_id", { count: "exact" }).eq("status", "PUBLISHED").limit(1),
    serverDb.from("tool").select("_id", { count: "exact" }).eq("status", "PUBLISHED").limit(1),
    serverDb.from("user_profile").select("_id", { count: "exact" }).limit(1),
  ]);

  const stats = [
    { value: `${prompts.count ?? 0}+`, label: content.stats[0].label },
    { value: `${skills.count ?? 0}+`, label: content.stats[1].label },
    { value: `${tools.count ?? 0}+`, label: content.stats[2].label },
    { value: `${users.count ?? 0}+`, label: content.stats[3].label },
  ];

  return (
    <div className="bg-black px-6 pb-16 md:px-12">
      <div className="mx-auto flex max-w-[1160px] flex-row justify-between text-center">
        {stats.map((stat, index) => (
          <Reveal
            key={stat.label}
            direction="up"
            delay={index * 100}
            duration={700}
            threshold={0.3}
            className="flex max-w-[200px] flex-col items-center"
          >
            <div className="mb-3 h-px w-8 bg-white/20" />
            <div className="text-[36px] font-semibold leading-none tracking-[-0.04em] text-white sm:text-[42px] md:text-[48px]">
              {stat.value}
            </div>
            <div className="text-[11px] font-medium text-gray-400 sm:text-[12px] md:text-[13px]">
              {stat.label}
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
