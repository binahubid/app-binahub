import Link from "next/link";
import { ArrowRight, MapPinned } from "lucide-react";

export default function AdminNotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#F4F6F8] px-4 py-12">
      <section className="w-full max-w-xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-amber-50 text-amber-700"><MapPinned className="h-5 w-5" aria-hidden="true" /></span>
        <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">Halaman tidak ditemukan</p>
        <h1 className="mt-2 text-2xl font-bold tracking-[-0.035em] text-slate-950">Area admin ini tidak tersedia</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Tautan mungkin sudah dipindahkan saat navigasi admin disederhanakan. Data Anda tidak berubah.</p>
        <Link href="/admin/dashboard" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#071B3D] px-5 text-sm font-semibold text-white hover:bg-[#0B2C6B]">
          Kembali ke dashboard <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}
