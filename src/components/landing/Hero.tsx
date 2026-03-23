/**
 * VISUAL LOCK — Hero Section
 *
 * The styling, layout, classes, spacing (pt, mt), font sizes, Reveal animations,
 * stat bar, CTA button, and overflow behavior in this component have been approved.
 * Do NOT change any className, inline style, spacing, or visual property unless
 * the user explicitly asks to modify the Hero UI/UX.
 */
import { getLocale } from "next-intl/server";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getHomeContent } from "./content";
import HeroHalo from "./HeroHalo";
import Reveal from "@/components/shared/Reveal";

export default async function Hero() {
  const locale = await getLocale();
  const content = getHomeContent(locale);
  const isZh = locale === "zh";

  return (
    <section className="relative min-h-screen overflow-visible bg-black text-white">
      <main className="relative flex min-h-screen flex-col">
        <HeroHalo />

        <div className="relative z-10 mx-auto flex w-full max-w-[1160px] flex-col items-center justify-start px-4 pt-[15vh] pb-4 text-center sm:px-6">
          <Reveal
            direction="down"
            duration={1800}
            threshold={0.1}
            className={isZh ? "mt-10 md:mt-12" : "mt-10 md:mt-12"}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-black px-4 py-2 text-xs font-medium text-gray-300 backdrop-blur-[2px] sm:text-sm">
              <Sparkles size={14} className="text-[#ff7a45]" />
              {content.hero.badge}
            </div>
          </Reveal>

          <Reveal
            direction="up"
            delay={200}
            duration={1800}
            threshold={0.1}
            className={isZh ? "mt-3 md:mt-4" : "mt-4 md:mt-5"}
          >
            <h1
              className={`mt-5 text-white ${
                isZh
                  ? "max-w-[1040px] font-[family:var(--font-noto-sans-sc)] text-[44px] sm:text-[56px] md:text-[68px] lg:text-[76px] leading-[1.06] font-normal tracking-[0.04em]"
                  : "max-w-[920px] text-[46px] sm:text-[58px] md:text-[72px] lg:text-[80px] leading-[1.02] font-semibold tracking-[-0.04em]"
              }`}
            >
              <span className="block">{content.hero.title[0]}</span>
              {content.hero.title[1] ? <span className="block">{content.hero.title[1]}</span> : null}
            </h1>
          </Reveal>

          <Reveal direction="up" delay={400} duration={1800} threshold={0.1} className="mt-8 md:mt-10">
            <div className="mt-5">
              <p
                className={`text-gray-400 leading-relaxed ${
                  isZh
                    ? "mx-auto max-w-[720px] text-[13px] sm:text-[14px] md:text-[15px] leading-[1.75] tracking-[-0.01em]"
                    : "mx-auto max-w-[700px] text-[17px] sm:text-[18px] md:text-[19px]"
                }`}
              >
                {isZh ? (
                  <>
                    {content.hero.description.split("，用于")[0]}
                    <br />
                    用于
                    {content.hero.description.split("，用于")[1]}
                  </>
                ) : (
                  content.hero.description
                )}
              </p>

              <Link
                href="/prompts"
                className="group mx-auto mt-8 inline-flex items-center rounded-xl bg-white py-2.5 pl-6 pr-2.5 text-sm font-semibold text-black"
              >
                <span className="pr-3">{content.hero.primaryCta}</span>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/10 text-black transition-colors duration-300 group-hover:bg-black group-hover:text-white">
                  <ArrowUpRight size={15} strokeWidth={2} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </Link>
            </div>
          </Reveal>

          <div className="mt-16 flex w-full flex-row justify-between px-4 text-center md:mt-20 md:px-12">
            {content.stats.map((stat, index) => (
              <Reveal
                key={stat.label}
                direction="up"
                delay={index * 120}
                duration={1400}
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
      </main>
    </section>
  );
}
