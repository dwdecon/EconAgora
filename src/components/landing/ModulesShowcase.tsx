import { getLocale } from "next-intl/server";
import {
  BookOpen,
  Code2,
  Cpu,
  FileText,
  MessagesSquare,
  Network,
  type LucideIcon,
} from "lucide-react";
import Reveal from "@/components/shared/Reveal";
import { getHomeContent, localizeHref } from "./content";

function ArrowIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
    >
      <path d="M7 17L17 7M17 7H7M17 7V17" />
    </svg>
  );
}

export default async function ModulesShowcase() {
  const locale = await getLocale();
  const content = getHomeContent(locale);
  const icons: LucideIcon[] = [
    BookOpen,
    MessagesSquare,
    FileText,
    Network,
    Cpu,
    Code2,
  ];

  return (
      <section id="modules" className="relative bg-black py-20">
      <div className="pointer-events-none absolute left-1/2 top-[44%] h-[720px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(255,90,0,0.14),_rgba(255,20,83,0.12)_38%,_rgba(0,209,255,0.06)_60%,_transparent_74%)] blur-[130px]" />
      <div className="mx-auto max-w-[1440px] px-6">
        <Reveal direction="up" threshold={0.25} className="mb-12 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
            <div className="mr-1 h-1.5 w-1.5 rotate-45 bg-[#ff5a00]" />
            {content.modules.eyebrow}
          </div>
          <h2 className="mb-8 text-4xl font-semibold leading-[0.85] tracking-[-0.05em] md:text-5xl lg:text-6xl">
            {content.modules.title[0]}
            <br />
            <span className="opacity-30">{content.modules.title[1]}</span>
          </h2>
          <p className="mx-auto max-w-3xl text-sm font-medium leading-relaxed text-white/40 md:text-base">
            {content.modules.description}
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {content.modules.cards.map((card, index) => {
            const href = localizeHref(locale, card.href);
            const Icon = icons[index % icons.length];

            const body = (
              <>
                <div className="relative z-10 mb-6 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/6 text-white/80">
                  <Icon size={16} />
                </div>
                <h3 className="relative z-10 mb-3 text-lg font-semibold tracking-tight">
                  {card.title}
                </h3>
                <p className="relative z-10 mb-6 max-w-[34ch] text-[13px] leading-relaxed text-white/45 transition-colors duration-700 group-hover:text-black/60">
                  {card.description}
                </p>
                <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 transition-all duration-700 group-hover:border-black/20">
                  <ArrowIcon />
                </div>
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.16),_transparent_45%)] opacity-60 transition-opacity duration-700 group-hover:opacity-80" />
              </>
            );

            const className =
              `group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_20px_60px_rgba(0,0,0,0.4)] transition-all duration-700 hover:bg-white hover:text-black ${
                index === 0 || index === 5 ? "lg:col-span-2 min-h-[200px]" : "min-h-[180px]"
              }`;

            if (card.external) {
              return (
                <Reveal
                  key={card.title}
                  direction="scale"
                  delay={index * 110}
                  threshold={0.18}
                >
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className={className}
                  >
                    {body}
                  </a>
                </Reveal>
              );
            }

            return (
              <Reveal
                key={card.title}
                direction="scale"
                delay={index * 110}
                threshold={0.18}
              >
                <a href={href} className={className}>
                  {body}
                </a>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
