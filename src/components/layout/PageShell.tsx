interface PageShellProps {
  children: React.ReactNode;
  width?: "article" | "3xl" | "4xl" | "6xl";
  className?: string;
}

const WIDTH_CLASS: Record<NonNullable<PageShellProps["width"]>, string> = {
  article: "max-w-[720px]",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "6xl": "max-w-6xl",
};

export default function PageShell({
  children,
  width = "6xl",
  className = "",
}: PageShellProps) {
  return (
    <section
      className={[
        "mx-auto w-full px-6 pt-28 pb-12 md:pt-32 lg:pt-36",
        WIDTH_CLASS[width],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </section>
  );
}
