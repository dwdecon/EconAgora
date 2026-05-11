import { Suspense } from "react";
import Hero from "@/components/landing/Hero";
import PartnerMarquee from "@/components/landing/PartnerMarquee";
import ManifestoSection from "@/components/landing/ManifestoSection";
import ModulesShowcaseAsync from "@/components/landing/ModulesShowcaseAsync";
import ModulesSkeleton from "@/components/landing/ModulesSkeleton";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import Testimonials from "@/components/landing/Testimonials";
import FAQAccordion from "@/components/landing/FAQAccordion";
import CTASection from "@/components/landing/CTASection";
import { getLocale } from "next-intl/server";

export default async function Home() {
  const locale = await getLocale();

  return (
    <div className="relative overflow-x-clip bg-black text-white selection:bg-[#ff1453]/30">
      <Hero />
      <PartnerMarquee />
      <ManifestoSection />
      <Suspense fallback={<ModulesSkeleton />}>
        <ModulesShowcaseAsync locale={locale} />
      </Suspense>
      <FeaturesGrid />
      <Testimonials />
      <FAQAccordion />
      <CTASection />
    </div>
  );
}
