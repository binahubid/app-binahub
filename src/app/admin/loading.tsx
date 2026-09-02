export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-[#F4F6F8] lg:pl-[18rem]" role="status" aria-live="polite">
      <span className="sr-only">Memuat halaman admin...</span>
      <aside className="fixed inset-y-0 left-0 hidden w-[18rem] bg-[#071B3D] lg:block" aria-hidden="true">
        <div className="px-6 pt-7"><div className="h-8 w-32 animate-pulse rounded bg-white/10" /></div>
        <div className="mt-12 space-y-3 px-5">{Array.from({ length: 9 }).map((_, index) => <div key={index} className="h-10 animate-pulse rounded-xl bg-white/[0.055]" />)}</div>
      </aside>
      <div className="h-[4.75rem] border-b border-slate-200 bg-white" />
      <main className="mx-auto max-w-[1680px] px-4 py-7 sm:px-6 lg:px-8" aria-hidden="true">
        <div className="animate-pulse">
          <div className="h-3 w-32 rounded bg-slate-200" />
          <div className="mt-3 h-9 w-80 max-w-full rounded bg-slate-200" />
          <div className="mt-3 h-4 w-[34rem] max-w-full rounded bg-slate-200" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-32 rounded-2xl border border-slate-200 bg-white" />)}
          </div>
          <div className="mt-5 h-[26rem] rounded-2xl border border-slate-200 bg-white" />
        </div>
      </main>
    </div>
  );
}
