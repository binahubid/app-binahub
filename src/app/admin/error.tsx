"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4 py-12">
      <section role="alert" aria-labelledby="admin-error-title" className="w-full max-w-lg border border-red-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <span className="mx-auto flex h-12 w-12 items-center justify-center bg-red-50 text-red-700">
          <AlertTriangle size={22} aria-hidden="true" />
        </span>
        <h1 id="admin-error-title" className="mt-5 text-xl font-bold text-slate-900">Halaman tidak dapat dimuat</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Data Anda tidak berubah. Coba muat ulang halaman ini; bila masalah berulang, catat waktu kejadian untuk tim teknis.
        </p>
        <button type="button" onClick={reset} className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0B2C6B] px-5 text-sm font-semibold text-white hover:bg-[#071B3D]">
          <RefreshCw size={16} aria-hidden="true" /> Coba lagi
        </button>
      </section>
    </main>
  );
}
