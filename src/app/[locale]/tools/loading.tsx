export default function ToolsLoading() {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <div className="h-6 w-24 mx-auto bg-[var(--color-bg-surface)] rounded" />
          <div className="h-12 w-80 mx-auto mt-4 bg-[var(--color-bg-surface)] rounded" />
          <div className="h-6 w-96 mx-auto mt-4 bg-[var(--color-bg-surface)] rounded" />
        </div>

        <div className="h-64 mb-8 bg-[var(--color-bg-surface)] rounded-[24px]" />

        <div className="flex gap-4 mb-6">
          <div className="h-9 w-32 bg-[var(--color-bg-surface)] rounded-full" />
          <div className="h-9 w-32 bg-[var(--color-bg-surface)] rounded-full" />
          <div className="h-9 w-32 bg-[var(--color-bg-surface)] rounded-full" />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-[280px] bg-[var(--color-bg-surface)] rounded-[24px]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}