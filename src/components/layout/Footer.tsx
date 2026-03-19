import { Link } from "@/i18n/navigation";

export default function Footer() {
  return (
    <footer className="border-t border-dark-border bg-dark">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div>
            <Link href="/" className="text-xl font-bold">
              AI<span className="text-primary">4</span>Econ
            </Link>
            <p className="mt-2 text-sm text-gray-text max-w-xs">
              AI Toolkit For Economist — 为新时代经管研究者打造的 AI 科研基础设施
            </p>
          </div>
          <div className="flex gap-12">
            <div className="flex flex-col gap-2 text-sm">
              <span className="font-semibold mb-1">Platform</span>
              <Link href="/prompts" className="text-gray-text hover:text-white transition">Prompts</Link>
              <Link href="/community" className="text-gray-text hover:text-white transition">Community</Link>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <span className="font-semibold mb-1">Links</span>
              <a href="https://github.com/dwdecon/AI4Econ" target="_blank" rel="noopener" className="text-gray-text hover:text-white transition">GitHub</a>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-dark-border text-sm text-gray-text">
          © 2026 AI4Econ. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
