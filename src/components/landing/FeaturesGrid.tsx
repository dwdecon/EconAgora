import { getLocale } from "next-intl/server";
import { Sparkles, Zap, RefreshCw, type LucideIcon } from "lucide-react";
import Reveal from "@/components/shared/Reveal";
import { getHomeContent } from "./content";

const FEATURE_ICONS: LucideIcon[] = [Sparkles, RefreshCw, Zap];
const FEATURE_ACCENTS = ["#f97316", "#06b6d4", "#ec4899"];
const FEATURE_TAGS = ["MOD-01", "MOD-02", "MOD-03"];

export default async function FeaturesGrid() {
  const locale = await getLocale();
  const content = getHomeContent(locale);

  return (
    <section id="advantages" className="relative overflow-hidden py-32">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(255,255,255,0.06),_transparent_62%)] blur-[120px]" />

      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        <div className="flex flex-col gap-20 lg:flex-row lg:items-start">

          {/* ── 左侧：叙事轴线 ── */}
          <div className="lg:w-1/3">
            <div className="sticky top-28">
              <Reveal direction="up" threshold={0.3}>
                <div className="mb-8 flex items-center gap-4">
                  <span className="h-px w-8 bg-white/20" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">
                    {content.features.eyebrow}
                  </span>
                </div>
              </Reveal>

              <Reveal direction="up" delay={200} threshold={0.3}>
                <h2 className="mb-8 text-4xl font-semibold tracking-tight leading-tight md:text-5xl">
                  {content.features.title[0]}
                </h2>
              </Reveal>

              <Reveal direction="up" delay={400} threshold={0.3}>
                <div className="relative pl-8">
                  <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-white/30 via-white/10 to-transparent" />
                  <p className="text-lg leading-relaxed text-white/40">
                    {content.features.description}
                  </p>
                </div>
              </Reveal>
            </div>
          </div>

          {/* ── 右侧：Bento 布局 ── */}
          <div className="lg:w-2/3">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {content.features.cards.map((feature, index) => {
                const Icon = FEATURE_ICONS[index % FEATURE_ICONS.length];
                const accent = FEATURE_ACCENTS[index % FEATURE_ACCENTS.length];
                const tag = FEATURE_TAGS[index % FEATURE_TAGS.length];

                return (
                  <Reveal
                    key={feature.title}
                    direction="scale"
                    delay={200 + index * 120}
                    threshold={0.2}
                    className={index === 0 ? "md:col-span-2" : ""}
                  >
                    <div className="group relative h-full overflow-hidden rounded-[2rem] border border-white/5 bg-white/[0.02] p-8 transition-all duration-700 hover:border-white/10 hover:bg-white/[0.04]">
                      {/* 顶部标签 */}
                      <div className="mb-10 flex items-center justify-between">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-500 group-hover:scale-110"
                          style={{ backgroundColor: `${accent}18`, color: accent }}
                        >
                          <Icon size={24} />
                        </div>
                        <span className="rounded border border-white/10 px-2 py-0.5 font-mono text-[10px] tracking-widest text-white/20">
                          [{tag}]
                        </span>
                      </div>

                      <div className="max-w-xl">
                        <h3 className="mb-4 text-2xl font-bold tracking-tight transition-colors group-hover:text-white">
                          {feature.title}
                        </h3>
                        <p className="text-lg leading-relaxed text-white/40 transition-colors group-hover:text-white/60">
                          {feature.description}
                        </p>
                      </div>

                      {/* 背景装饰图标 */}
                      <div className="absolute -right-4 -bottom-4 opacity-[0.04] transition-opacity duration-500 group-hover:opacity-[0.08]">
                        <Icon size={160} strokeWidth={1} />
                      </div>

                      {/* 悬停扫描线 */}
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-tr from-transparent via-white/[0.015] to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                    </div>
                  </Reveal>
                );
              })}
            </div>

            {/* 底部装饰 */}
            <div className="mt-12 flex items-center justify-between px-4">
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-1 w-1 rounded-full bg-white/10" />
                ))}
              </div>
              <span className="font-mono text-[10px] text-white/10">STABLE_RELEASE_V1.0</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
