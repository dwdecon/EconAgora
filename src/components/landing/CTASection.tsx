import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Reveal from "@/components/shared/Reveal";
import { getHomeContent } from "./content";

export default async function CTASection() {
  const locale = await getLocale();
  const content = getHomeContent(locale);

  return (
    <section className="bg-black py-24 md:py-32">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <Reveal direction="up" threshold={0.15}>
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
            <div className="mr-1 h-1.5 w-1.5 rotate-45 bg-[#ff5a00]" />
            {content.cta.badge}
          </div>

          {/* Title */}
          <h2 className="mb-6 text-3xl font-semibold leading-tight tracking-[-0.03em] text-white md:text-5xl">
            {content.cta.title[0]}
            <br />
            <span className="font-serif italic opacity-30">
              {content.cta.accent}
            </span>{" "}
            {content.cta.title[1]}
          </h2>

          {/* Description */}
          <p className="mx-auto mb-10 max-w-xl text-sm font-medium leading-relaxed text-[#A1A1AA] md:text-base">
            {content.cta.description}
          </p>

          {/* Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/auth/register"
              className="w-full rounded-full bg-white px-8 py-4 text-base font-bold text-black transition-colors duration-300 hover:bg-gray-200 sm:w-auto"
            >
              {content.cta.primary}
            </Link>
            <Link
              href="/prompts"
              className="w-full rounded-full border-2 border-white/10 px-8 py-4 text-base font-bold text-white transition-colors duration-300 hover:border-white sm:w-auto"
            >
              {content.cta.secondary}
            </Link>
          </div>

          {/* Hint */}
          <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-white/40">
            <span>→</span>
            {content.cta.hint}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
