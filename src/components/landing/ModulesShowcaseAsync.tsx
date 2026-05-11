import ModulesShowcase from "./ModulesShowcase";
import { fetchFeaturedPrompts } from "@/lib/prompts";
import { fetchFeaturedSkills } from "@/lib/skills";
import { fetchFeaturedTools } from "@/lib/tools";
import { fetchFeaturedPosts, fetchFeaturedAgentPosts } from "@/lib/posts";

export default async function ModulesShowcaseAsync({
  locale,
}: {
  locale: string;
}) {
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
    <ModulesShowcase
      locale={locale}
      featuredPrompts={featuredPrompts}
      featuredSkills={featuredSkills}
      featuredTools={featuredTools}
      featuredPosts={featuredPosts}
      featuredAgentPosts={featuredAgentPosts}
    />
  );
}
