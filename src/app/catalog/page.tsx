import Link from "next/link";
import { ArrowRight, CheckCircle2, Layers3 } from "lucide-react";
import { publicApiUrl } from "@/lib/public-api";

type CatalogModule = { id: string; code: string; slug: string; name: string; description: string | null; standardScope: string | null; deliverables: string | null; pricingUnit: string; basePrice: number; minimumQuantity: number; currency: string; durationLabel: string | null; featured: boolean };
type CatalogProduct = { key: string; slug: string; name: string; objective: string | null; shortDescription: string | null; description: string | null; coverImageUrl: string | null; featured: boolean; modules: CatalogModule[] };

async function catalog() {
  try {
    const response = await fetch(publicApiUrl("/api/catalog/modules"), { next: { revalidate: 60 } });
    if (!response.ok) return [] as CatalogProduct[];
    const body = await response.json();
    return body.success ? body.products as CatalogProduct[] : [];
  } catch { return [] as CatalogProduct[]; }
}

function money(amount: number, currency: string) { return new Intl.NumberFormat("id-ID", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount); }

export default async function PublicCatalogPage() {
  const products = await catalog();
  return <main className="min-h-screen bg-[#F7F8FA] text-slate-900">
    <header className="border-b border-slate-200 bg-[#071B3D] text-white"><div className="mx-auto max-w-7xl px-5 py-6 sm:px-8"><div className="flex items-center justify-between gap-4"><Link href="/" className="text-xl font-bold tracking-tight">BinaHub</Link><Link href="/insight" className="inline-flex min-h-10 items-center bg-white px-4 text-xs font-bold text-[#071B3D]">Mulai Diagnosa</Link></div></div></header>
    <section className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20"><p className="text-[11px] font-bold uppercase tracking-[0.24em] text-amber-600">Official service catalog</p><h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-[-0.04em] text-slate-950 sm:text-6xl">Solusi yang jelas, scope yang transparan.</h1><p className="mt-6 max-w-2xl text-base leading-7 text-slate-600">Lihat layanan resmi BinaHub beserta ruang lingkup, deliverables, durasi, dan harga dasarnya. Katalog diperbarui langsung oleh tim operasional.</p></div></section>
    <div className="mx-auto max-w-7xl space-y-12 px-5 py-12 sm:px-8">{products.length === 0 ? <section className="border border-slate-200 bg-white p-10 text-center"><Layers3 className="mx-auto h-8 w-8 text-slate-300" /><h2 className="mt-4 font-bold">Katalog sedang dipersiapkan</h2><p className="mt-2 text-sm text-slate-500">Produk akan muncul setelah disetujui dan dipublikasikan oleh admin.</p></section> : products.map((product) => <section key={product.key} aria-labelledby={`product-${product.key}`}><div className="grid gap-6 border-b border-slate-300 pb-6 lg:grid-cols-[0.7fr_1.3fr]"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-600">{product.key}</p><h2 id={`product-${product.key}`} className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{product.name}</h2></div><p className="max-w-3xl text-sm leading-7 text-slate-600">{product.description || product.shortDescription || product.objective}</p></div><div className="mt-6 grid gap-5 lg:grid-cols-2">{product.modules.map((module) => <article key={module.id} className="border border-slate-200 bg-white p-6 shadow-[0_16px_45px_-36px_rgba(15,23,42,0.35)]"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{module.code}</p><h3 className="mt-2 text-xl font-bold text-slate-950">{module.name}</h3></div>{module.featured && <span className="bg-amber-100 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-amber-800">Unggulan</span>}</div><p className="mt-4 text-sm leading-6 text-slate-600">{module.description}</p><dl className="mt-5 grid gap-3 border-y border-slate-100 py-4 text-xs"><div className="flex justify-between gap-3"><dt className="text-slate-500">Harga dasar</dt><dd className="font-bold text-slate-950">{money(module.basePrice, module.currency)}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Satuan</dt><dd className="font-semibold text-slate-700">{module.pricingUnit}</dd></div>{module.durationLabel && <div className="flex justify-between gap-3"><dt className="text-slate-500">Durasi</dt><dd className="font-semibold text-slate-700">{module.durationLabel}</dd></div>}</dl>{module.deliverables && <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-slate-600"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span>{module.deliverables}</span></div>}<Link href="/insight" className="mt-6 inline-flex min-h-11 items-center gap-2 bg-[#0B2C6B] px-5 text-xs font-bold text-white">Diskusikan kebutuhan <ArrowRight className="h-4 w-4" /></Link></article>)}</div></section>)}</div>
  </main>;
}
