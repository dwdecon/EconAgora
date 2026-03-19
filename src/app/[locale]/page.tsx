import { getTranslations } from "next-intl/server";

export default async function Home() {
  const t = await getTranslations("landing");
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-5xl font-bold">{t("slogan")}</h1>
      <p className="mt-4 text-gray-text">{t("subtitle")}</p>
    </main>
  );
}
