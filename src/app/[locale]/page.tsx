import Hero from "@/components/landing/Hero";
import StatsBar from "@/components/landing/StatsBar";
import ModulesShowcase from "@/components/landing/ModulesShowcase";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import FAQAccordion from "@/components/landing/FAQAccordion";
import CTASection from "@/components/landing/CTASection";

export default function Home() {
  return (
    <>
      <Hero />
      <StatsBar />
      <ModulesShowcase />
      <FeaturesGrid />
      <FAQAccordion />
      <CTASection />
    </>
  );
}
