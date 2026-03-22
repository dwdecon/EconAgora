import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Reveal from "@/components/shared/Reveal";
import { getHomeContent } from "./content";

const GalaxyGlow = () => (
  <div className="absolute -bottom-[300px] left-1/2 h-[800px] w-[1600px] -translate-x-1/2 overflow-hidden pointer-events-none z-0">
    <svg viewBox="0 0 1000 500" className="h-full w-full opacity-70">
      <defs>
        <filter id="galaxy-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="90" />
        </filter>
        <radialGradient id="galaxy-grad-1" cx="50%" cy="100%" r="70%">
          <stop offset="0%" stopColor="#ff1453" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#7a00ff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="galaxy-grad-2" cx="50%" cy="100%" r="60%">
          <stop offset="0%" stopColor="#00f2ff" stopOpacity="0.7" />
          <stop offset="50%" stopColor="#7a00ff" stopOpacity="0.3" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="divider-line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="50%" stopColor="white" stopOpacity="0.4" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>

      <g filter="url(#galaxy-blur)">
        <ellipse cx="450" cy="500" rx="600" ry="300" fill="url(#galaxy-grad-1)">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 500 500"
            to="360 500 500"
            dur="50s"
            repeatCount="indefinite"
          />
        </ellipse>
        <ellipse cx="550" cy="500" rx="500" ry="250" fill="url(#galaxy-grad-2)">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="360 500 500"
            to="0 500 500"
            dur="40s"
            repeatCount="indefinite"
          />
        </ellipse>
      </g>

      <rect x="0" y="498" width="1000" height="2" fill="url(#divider-line-grad)" />
    </svg>
  </div>
);

export default async function CTASection() {
  const locale = await getLocale();
  const content = getHomeContent(locale);

  return (
    <section className="relative overflow-hidden bg-black py-16">
      <div className="relative z-10 mx-auto max-w-[1440px] px-6">
        <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center md:rounded-[48px] md:p-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_transparent_55%)] opacity-60" />

          <Reveal direction="up" threshold={0.15} className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
              <div className="mr-1 h-1.5 w-1.5 rotate-45 bg-[#ff5a00]" />
              {content.cta.badge}
            </div>

            <h2 className="mb-6 text-3xl font-semibold leading-[0.85] tracking-[-0.05em] text-white md:text-5xl">
              {content.cta.title[0]}
              <br />
              <span className="font-serif opacity-30 italic">
                {content.cta.accent}
              </span>{" "}
              {content.cta.title[1]}
            </h2>

            <p className="mx-auto mb-10 max-w-2xl text-sm font-medium leading-relaxed text-[#A1A1AA] md:text-base">
              {content.cta.description}
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/auth/register"
                className="w-full rounded-full bg-white px-8 py-4 text-base font-bold text-black transition-all duration-500 hover:bg-gray-200 sm:w-auto"
              >
                {content.cta.primary}
              </Link>
              <Link
                href="/prompts"
                className="w-full rounded-full border-2 border-white/10 px-8 py-4 text-base font-bold text-white transition-all duration-500 hover:border-white sm:w-auto"
              >
                {content.cta.secondary}
              </Link>
            </div>
          </Reveal>

          <GalaxyGlow />

          <div className="pointer-events-none absolute inset-0 flex select-none items-center justify-center overflow-hidden">
            <span className="translate-y-[56%] text-[20vw] font-bold leading-none tracking-[-0.08em] text-white/[0.02] md:text-[16vw]">
              NOW
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
