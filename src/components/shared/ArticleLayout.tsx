import PageShell from "@/components/layout/PageShell";

interface ArticleLayoutProps {
  children: React.ReactNode;
}

export default function ArticleLayout({ children }: ArticleLayoutProps) {
  return (
    <PageShell width="article" className="pb-20">
      <div className="prose-article">{children}</div>
    </PageShell>
  );
}
