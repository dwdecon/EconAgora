import Hero from "@/components/landing/Hero";
import PartnerMarquee from "@/components/landing/PartnerMarquee";
import ManifestoSection from "@/components/landing/ManifestoSection";
import ModulesShowcase from "@/components/landing/ModulesShowcase";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import FAQAccordion from "@/components/landing/FAQAccordion";
import CTASection from "@/components/landing/CTASection";

export default function Home() {
  return (
    <div className="relative overflow-x-clip bg-black text-white selection:bg-[#ff1453]/30">
      <Hero />
      <PartnerMarquee />
      <ManifestoSection />
      <ModulesShowcase />
      <FeaturesGrid />
      <FAQAccordion />
      <CTASection />
    </div>
  );
}
