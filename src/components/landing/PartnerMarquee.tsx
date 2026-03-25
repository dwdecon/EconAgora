import { getLocale } from "next-intl/server";
import { User, GraduationCap, Bot } from "lucide-react";
import Reveal from "@/components/shared/Reveal";
import { getHomeContent } from "./content";

const DIAMOND_COLORS = [
  "bg-white",
  "bg-[#ff5a00]",
  "bg-[#f51ce6]",
  "bg-[#146ef5]",
  "bg-[#00d18f]",
];

function MarqueeTrack({ labels }: { labels: string[] }) {
  // Repeat labels enough times to fill the viewport seamlessly
  const repeated = [...labels, ...labels, ...labels, ...labels];
  return (
    <div className="flex shrink-0 items-center gap-10">
      {repeated.map((label, index) => (
        <div
          key={`${label}-${index}`}
          className="flex shrink-0 items-center gap-3 text-lg font-medium text-[#888]"
        >
          <span
            className={`inline-block h-3.5 w-3.5 shrink-0 rotate-45 rounded-[2px] ${
              DIAMOND_COLORS[index % DIAMOND_COLORS.length]
            }`}
          />
          <span className="whitespace-nowrap">{label}</span>
        </div>
      ))}
    </div>
  );
}

export default async function PartnerMarquee() {
  const locale = await getLocale();
  const content = getHomeContent(locale);

  return (
    <section className="relative z-10 w-full overflow-hidden bg-transparent pt-20 pb-10">
      <Reveal threshold={0.2} direction="up">
        <div className="mx-auto mb-8 flex max-w-[1440px] items-center gap-4 px-10">
          <div className="flex -space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-black bg-gradient-to-br from-[#ff5a00] to-[#ff2d55]">
              <User size={14} className="text-white" />
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-black bg-gradient-to-br from-[#146ef5] to-[#00d18f]">
              <GraduationCap size={14} className="text-white" />
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-black bg-gradient-to-br from-[#f51ce6] to-[#146ef5]">
              <Bot size={14} className="text-white" />
            </div>
          </div>
          <span className="text-[13px] font-medium text-[#A1A1AA]">
            {content.marquee.note}
          </span>
        </div>

        <div className="w-full overflow-hidden">
          <div
            style={{
              maskImage:
                "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
            }}
          >
            <div className="animate-marquee">
              <MarqueeTrack labels={content.marquee.labels} />
              <MarqueeTrack labels={content.marquee.labels} />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
