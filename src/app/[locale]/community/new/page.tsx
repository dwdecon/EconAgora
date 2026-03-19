import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import PostForm from "@/components/community/PostForm";

export default async function NewPostPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">发帖</h1>
      <PostForm />
    </div>
  );
}
