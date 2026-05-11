export default function ModulesSkeleton() {
  return (
    <section id="modules" className="relative bg-black py-24">
      <div className="mx-auto max-w-[1280px] px-6 md:px-10">
        {/* Header placeholder */}
        <div className="mb-16 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="w-full md:w-1/2">
            <div className="mb-5 h-6 w-32 rounded-full bg-white/5 animate-pulse" />
            <div className="h-14 w-3/4 rounded-lg bg-white/5 animate-pulse" />
          </div>
          <div className="mt-6 w-full max-w-[420px] md:w-1/2">
            <div className="mb-4 h-4 w-full rounded bg-white/5 animate-pulse" />
            <div className="h-4 w-2/3 rounded bg-white/5 animate-pulse" />
          </div>
        </div>

        {/* Tabs placeholder */}
        <div className="mb-10 flex items-center gap-2 border-b border-white/10 pb-px">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-10 w-24 rounded-t bg-white/5 animate-pulse"
            />
          ))}
        </div>

        {/* Cards placeholder */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-[420px] rounded-2xl border border-white/8 bg-white/[0.03] animate-pulse"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
