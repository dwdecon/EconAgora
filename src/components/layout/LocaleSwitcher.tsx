"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale() {
    const newLocale = locale === "zh" ? "en" : "zh";
    router.push(pathname, { locale: newLocale });
  }

  return (
    <button
      onClick={switchLocale}
      className="rounded-full border border-white/10 px-4 py-2.5 text-[13px] font-semibold text-white/80 transition-all duration-300 hover:border-white/30 hover:bg-white/5 hover:text-white"
    >
      {locale === "zh" ? "EN" : "中文"}
    </button>
  );
}
