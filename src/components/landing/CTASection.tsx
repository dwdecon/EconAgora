import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getHomeContent } from "./content";

function StarIcon() {
  return (
    <svg className="h-3 w-3 text-[#ff5a00]" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0L9.79 6.21L16 8L9.79 9.79L8 16L6.21 9.79L0 8L6.21 6.21L8 0Z" />
    </svg>
  );
}

export default async function CTASection() {
  const locale = await getLocale();
  const content = getHomeContent(locale);

  return (
    <>
      {/* ── Hero CTA ── */}
      <section className="hero-section">
        <div className="top-edge-light" />
        <div className="starry-bg" />
        <div className="hero-bottom-glow" />

        <div className="relative z-10 w-full max-w-4xl mx-auto px-6 text-center mt-8">
          {/* Badge */}
          <div className="mb-12 flex justify-center">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-black/30 px-5 py-2 backdrop-blur-md">
              <StarIcon />
              <span className="text-[13px] font-medium tracking-wide text-white/90">
                {content.cta.badge}
              </span>
            </div>
          </div>

          {/* Heading */}
          <h1 className="cta-heading mb-6 text-[44px] font-medium leading-[1.05] text-white md:text-[68px]">
            {content.cta.title[0]}
            <br />
            <span className="font-serif italic text-white/30">
              {content.cta.accent}
            </span>{" "}
            {content.cta.title[1]}
          </h1>

          {/* Description */}
          <p className="mx-auto mb-12 max-w-[700px] text-[16px] font-normal leading-[1.6] text-white/60 md:text-[19px]">
            {content.cta.description}
          </p>

          {/* Buttons */}
          <div className="flex flex-col items-center justify-center gap-5 sm:flex-row">
            <Link
              href="/auth/register"
              className="squircle-btn w-full bg-white px-10 py-4 text-center text-[16px] font-semibold text-black transition-transform active:scale-[0.98] sm:w-auto sm:min-w-[190px]"
            >
              {content.cta.primary}
            </Link>
            <Link
              href="/prompts"
              className="squircle-btn w-full border border-white/20 bg-white/[0.05] px-10 py-4 text-center text-[16px] font-semibold text-white backdrop-blur-2xl transition-all hover:bg-white/[0.1] active:scale-[0.98] sm:w-auto sm:min-w-[190px]"
            >
              {content.cta.secondary}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Brand fold section ── */}
      <section className="brand-logo-section">
        <div className="pure-fold-curtain" />
        <div className="giant-watermark-text">EconAgora</div>
      </section>
    </>
  );
}
