interface ArticleLayoutProps {
  children: React.ReactNode;
}

export default function ArticleLayout({ children }: ArticleLayoutProps) {
  return (
    <section className="pt-32 pb-20">
      <div className="mx-auto max-w-[720px] px-6">
        <div className="prose-article">{children}</div>
      </div>
    </section>
  );
}
