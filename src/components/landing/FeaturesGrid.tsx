import { getLocale } from "next-intl/server";
import { Shield, Sparkles, Zap, type LucideIcon } from "lucide-react";
import Reveal from "@/components/shared/Reveal";
import { getHomeContent } from "./content";

export default async function FeaturesGrid() {
  const locale = await getLocale();
  const content = getHomeContent(locale);
  const icons: LucideIcon[] = [Sparkles, Zap, Shield];
  const accents = ["text-[#ff7a45]", "text-[#ff1453]", "text-[#00d1ff]"];

  return (
    <section id="advantages" className="relative bg-black py-32">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(255,255,255,0.06),_transparent_62%)] blur-[120px]" />
      <div className="mx-auto grid max-w-[1440px] gap-16 px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <Reveal direction="up" threshold={0.22}>
          <div className="sticky top-28">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em]">
              {content.features.eyebrow}
            </div>
            <h2 className="mb-10 text-5xl font-semibold leading-[0.9] tracking-[-0.04em] md:text-[88px]">
              {content.features.title[0]}
              <br />
              <span className="text-white/30">{content.features.title[1]}</span>
            </h2>
            <p className="max-w-2xl text-lg font-medium leading-relaxed text-white/40 md:text-[24px]">
              {content.features.description}
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {content.features.cards.map((feature, index) => {
            const Icon = icons[index % icons.length];
            return (
              <Reveal
                key={feature.title}
                direction="scale"
                delay={index * 140}
                threshold={0.2}
                className={index === 0 ? "md:col-span-2" : ""}
              >
                <div className="group relative h-full overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.05] p-10 backdrop-blur-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_18px_60px_rgba(0,0,0,0.45)] transition-all duration-500 hover:bg-white/[0.08]">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.14),_transparent_44%)] opacity-70" />
                  <div className="relative z-10">
                    <Icon size={30} className={`mb-8 ${accents[index % accents.length]}`} />
                    <h3 className="mb-6 text-2xl font-semibold tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="max-w-[32ch] leading-relaxed text-white/50">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
