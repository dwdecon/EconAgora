"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getHomeContent, localizeHref } from "@/components/landing/content";

function BrandMark() {
  return (
    <img
      src="/logo.png"
      alt="EconAgora"
      width="25"
      height="25"
      className="object-contain" style={{ filter: "brightness(0) invert(1)" }}
    />
  );
}

export default function Footer() {
  const locale = useLocale();
  const content = getHomeContent(locale);

  return (
    <footer className="border-t border-white/5 bg-black pt-40 pb-16">
      <div className="mx-auto max-w-[1440px] px-6">
        <div className="mb-40 grid grid-cols-1 gap-20 lg:grid-cols-4 lg:gap-24">
          <div>
            <Link href="/" className="mb-12 flex items-center gap-3">
              <BrandMark />
              <span className="text-3xl font-medium tracking-[-0.05em]">
                EconAgora
              </span>
            </Link>
            <p className="max-w-xs text-[18px] leading-relaxed text-white/40">
              {content.footer.description}
            </p>
          </div>

          {content.footer.groups.map((group) => (
            <div key={group.title}>
              <h4 className="mb-12 text-[11px] font-bold uppercase tracking-[0.2em] text-white/20">
                {group.title}
              </h4>
              <ul className="space-y-6">
                {group.items.map((item) => {
                  const href = localizeHref(locale, item.href);

                  if ("external" in item && item.external) {
                    return (
                      <li key={item.label}>
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[18px] font-medium text-white/50 transition-colors duration-300 hover:text-white"
                        >
                          {item.label}
                        </a>
                      </li>
                    );
                  }

                  return (
                    <li key={item.label}>
                      <a
                        href={href}
                        className="text-[18px] font-medium text-white/50 transition-colors duration-300 hover:text-white"
                      >
                        {item.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="mb-12 text-[11px] font-bold uppercase tracking-[0.2em] text-white/20">
              {content.footer.updatesTitle}
            </h4>
            <p className="mb-10 text-[18px] leading-relaxed text-white/40">
              {content.footer.updatesDescription}
            </p>
            <div className="flex flex-col gap-4">
              <a
                href={localizeHref(locale, content.footer.updatesPrimary.href)}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl bg-white px-8 py-5 text-center text-[14px] font-bold text-black transition-all duration-500 hover:bg-gray-200"
              >
                {content.footer.updatesPrimary.label}
              </a>
              <a
                href={localizeHref(locale, content.footer.updatesSecondary.href)}
                className="rounded-2xl border border-white/10 px-8 py-5 text-center text-[14px] font-bold text-white transition-all duration-500 hover:border-white"
              >
                {content.footer.updatesSecondary.label}
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-8 border-t border-white/5 pt-12 md:flex-row">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/20">
            {content.footer.legal}
          </p>
          <div className="flex items-center gap-8 text-[11px] font-bold uppercase tracking-[0.2em] text-white/20">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rotate-45 bg-[#ff5a00]" />
              Research-ready prompts
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rotate-45 bg-[#7a00ff]" />
              Human + agent workflows
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
