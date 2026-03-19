import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import PromptForm from "@/components/prompts/PromptForm";

export default async function NewPromptPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">发布 Prompt</h1>
      <PromptForm />
    </div>
  );
}
