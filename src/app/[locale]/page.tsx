import Hero from "@/components/landing/Hero";
import PartnerMarquee from "@/components/landing/PartnerMarquee";
import ManifestoSection from "@/components/landing/ManifestoSection";
import ModulesShowcase from "@/components/landing/ModulesShowcase";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import Testimonials from "@/components/landing/Testimonials";
import FAQAccordion from "@/components/landing/FAQAccordion";
import CTASection from "@/components/landing/CTASection";
import HaloReveal from "@/components/landing/HaloReveal";
import { getLocale } from "next-intl/server";
import { fetchFeaturedPrompts } from "@/lib/prompts";
import { fetchFeaturedSkills } from "@/lib/skills";
import { fetchFeaturedTools } from "@/lib/tools";
import { fetchFeaturedPosts, fetchFeaturedAgentPosts } from "@/lib/posts";

export default async function Home() {
  const locale = await getLocale();

  const [
    featuredPrompts,
    featuredSkills,
    featuredTools,
    featuredPosts,
    featuredAgentPosts,
  ] = await Promise.all([
    fetchFeaturedPrompts(),
    fetchFeaturedSkills(),
    fetchFeaturedTools(),
    fetchFeaturedPosts(),
    fetchFeaturedAgentPosts(),
  ]);

  return (
    <HaloReveal>
    <div className="relative overflow-x-clip bg-black text-white selection:bg-[#ff1453]/30">
      <Hero />
      <PartnerMarquee />
      <ManifestoSection />
      <ModulesShowcase
        locale={locale}
        featuredPrompts={featuredPrompts}
        featuredSkills={featuredSkills}
        featuredTools={featuredTools}
        featuredPosts={featuredPosts}
        featuredAgentPosts={featuredAgentPosts}
      />
      <FeaturesGrid />
      <Testimonials />
      <FAQAccordion />
      <CTASection />
    </div>
    </HaloReveal>
  );
}
