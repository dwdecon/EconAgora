import { getPosts } from "@/actions/community";
import PostCard from "@/components/community/PostCard";
import Pagination from "@/components/shared/Pagination";
import { Link } from "@/i18n/navigation";

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Number(pageStr) || 1;
  const { posts, pages } = await getPosts({ page });

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">社区</h1>
        <Link
          href="/community/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition"
        >
          发帖
        </Link>
      </div>
      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
      {posts.length === 0 && (
        <p className="text-center text-gray-text py-20">暂无帖子</p>
      )}
      <Pagination currentPage={page} totalPages={pages} basePath="/community" />
    </div>
  );
}
