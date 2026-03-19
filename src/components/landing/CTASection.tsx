import { Link } from "@/i18n/navigation";

export default function CTASection() {
  return (
    <section className="py-24 bg-dark-card">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl font-bold">开始你的 AI 科研之旅</h2>
        <p className="mt-4 text-gray-text">加入 AI4Econ，与全球经济学研究者一起探索 AI 赋能科研的无限可能</p>
        <div className="mt-8 flex gap-4 justify-center">
          <Link
            href="/auth/register"
            className="rounded-lg bg-primary px-8 py-3 font-semibold text-white hover:bg-primary-hover transition"
          >
            免费注册
          </Link>
          <Link
            href="/prompts"
            className="rounded-lg border border-dark-border px-8 py-3 font-semibold text-white hover:border-gray-text transition"
          >
            浏览 Prompt 库
          </Link>
        </div>
      </div>
    </section>
  );
}
