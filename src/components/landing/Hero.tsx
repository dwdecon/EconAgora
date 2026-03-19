import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function Hero() {
  const t = await getTranslations("landing");

  return (
    <section className="relative overflow-hidden py-24 md:py-36">
      <div className="absolute inset-0 bg-gradient-to-b from-dark via-dark-card to-dark" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-primary)_0%,_transparent_70%)] animate-pulse" />
      </div>
      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <p className="font-mono text-sm uppercase tracking-[0.2em] text-primary mb-6">
          {t("slogan")}
        </p>
        <h1 className="text-4xl md:text-6xl font-bold leading-tight">
          {t("subtitle")}
        </h1>
        <p className="mt-6 text-lg text-gray-text max-w-2xl mx-auto">
          Prompt · Skill · MCP · 教程 · 前沿追踪 · 人机共创社区
        </p>
        <div className="mt-10 flex gap-4 justify-center">
          <Link
            href="/prompts"
            className="rounded-lg bg-primary px-8 py-3 font-semibold text-white hover:bg-primary-hover transition"
          >
            {t("explore")}
          </Link>
          <a
            href="https://github.com/dwdecon/AI4Econ"
            target="_blank"
            rel="noopener"
            className="rounded-lg border border-dark-border px-8 py-3 font-semibold text-white hover:border-gray-text transition"
          >
            {t("github")}
          </a>
        </div>
      </div>
    </section>
  );
}
