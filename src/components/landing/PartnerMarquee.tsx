import { getLocale } from "next-intl/server";
import Reveal from "@/components/shared/Reveal";
import { getHomeContent } from "./content";

function PartnerLogos({ labels }: { labels: string[] }) {
  return (
    <div className="flex items-center gap-16 px-8">
      {labels.map((label, index) => (
        <div
          key={`${label}-${index}`}
          className="flex items-center gap-3 text-lg font-medium text-[#888]"
        >
          <span
            className={`inline-block h-3.5 w-3.5 rotate-45 rounded-[2px] ${
              index % 5 === 0
                ? "bg-white"
                : index % 5 === 1
                  ? "bg-[#ff5a00]"
                  : index % 5 === 2
                    ? "bg-[#f51ce6]"
                    : index % 5 === 3
                      ? "bg-[#146ef5]"
                      : "bg-[#00d18f]"
            }`}
          />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

export default async function PartnerMarquee() {
  const locale = await getLocale();
  const content = getHomeContent(locale);

  return (
    <section className="relative z-10 w-full overflow-hidden border-t border-white/[0.05] bg-black/50 py-10">
      <Reveal threshold={0.2} direction="up">
        <div className="mx-auto mb-8 flex max-w-[1440px] items-center gap-4 px-10">
          <div className="flex -space-x-3">
            <div className="h-8 w-8 rounded-full border-2 border-black bg-gray-600" />
            <div className="h-8 w-8 rounded-full border-2 border-black bg-gray-500" />
            <div className="h-8 w-8 rounded-full border-2 border-black bg-gray-400" />
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
              <PartnerLogos labels={content.marquee.labels} />
              <PartnerLogos labels={content.marquee.labels} />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
