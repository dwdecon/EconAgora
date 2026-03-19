import { getPrompts } from "@/actions/prompts";
import PromptCard from "@/components/prompts/PromptCard";
import PromptFilters from "@/components/prompts/PromptFilters";
import Pagination from "@/components/shared/Pagination";

export default async function PromptsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string; tag?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const { prompts, pages } = await getPrompts({
    page,
    category: params.category,
    tag: params.tag,
    search: params.search,
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Prompt 库</h1>
      <PromptFilters />
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prompts.map((prompt) => (
          <PromptCard key={prompt.id} prompt={prompt} />
        ))}
      </div>
      {prompts.length === 0 && (
        <p className="text-center text-gray-text py-20">暂无内容</p>
      )}
      <Pagination currentPage={page} totalPages={pages} basePath="/prompts" />
    </div>
  );
}
