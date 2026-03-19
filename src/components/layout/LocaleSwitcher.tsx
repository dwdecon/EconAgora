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
      className="text-sm text-gray-text hover:text-white transition"
    >
      {locale === "zh" ? "EN" : "中文"}
    </button>
  );
}
