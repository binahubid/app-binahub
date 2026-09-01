export default function AdminLoading() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:pl-80" role="status" aria-live="polite">
      <span className="sr-only">Memuat halaman admin...</span>
      <div className="mx-auto max-w-7xl animate-pulse" aria-hidden="true">
        <div className="h-3 w-32 rounded bg-slate-200" />
        <div className="mt-3 h-9 w-64 max-w-full rounded bg-slate-200" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-36 rounded-2xl border border-slate-200 bg-white" />
          ))}
        </div>
      </div>
    </main>
  );
}
