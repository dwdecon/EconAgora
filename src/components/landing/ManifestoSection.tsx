import { getLocale } from "next-intl/server";
import Reveal from "@/components/shared/Reveal";
import { getHomeContent } from "./content";

export default async function ManifestoSection() {
  const locale = await getLocale();
  const content = getHomeContent(locale);

  return (
    <section
      id="manifesto"
      className="relative z-10 mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-12 px-6 pt-32 pb-40 md:flex-row md:px-10"
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[420px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(255,90,0,0.16),_rgba(255,20,83,0.08)_45%,_transparent_72%)] blur-[120px]" />

      <Reveal direction="up" threshold={0.3} className="max-w-[640px]">
        <h2 className="text-[48px] font-semibold leading-[1.02] tracking-[-0.04em] md:text-[64px]">
          {content.manifesto.title[0]}
          <br />
          <span className="text-[#A1A1AA]">{content.manifesto.title[1]}</span>
        </h2>
      </Reveal>

      <Reveal
        direction="left"
        delay={140}
        threshold={0.35}
        className="max-w-[440px]"
      >
        <div className="rounded-[32px] border border-white/8 bg-white/[0.03] p-8 backdrop-blur-2xl">
          <p className="mb-8 text-[16px] leading-[1.7] text-[#A1A1AA]">
            {content.manifesto.description}
          </p>
          <div className="flex items-center gap-12">
            {content.manifesto.metrics.map((metric) => (
              <div key={metric.label} className="border-t border-white/10 pt-5">
                <div className="bg-gradient-to-r from-white to-white/65 bg-clip-text text-[36px] font-semibold tracking-tight text-transparent">
                  {metric.value}
                </div>
                <div className="mt-1 text-[13px] font-medium text-[#A1A1AA]">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
