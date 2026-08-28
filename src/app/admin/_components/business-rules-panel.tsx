"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Edit3, Loader2, Plus, Save, ShieldAlert } from "lucide-react";
import type { CatalogModule, CatalogProduct } from "../_lib/types";

type RulesResponse = {
  selectedRuleSet?: { version?: string; status?: string; is_mock?: boolean };
  ruleSets?: Array<{
    version?: string;
    status?: string;
    is_mock?: boolean;
    rules?: {
      approvalState?: string;
      minimumTransaction?: number;
      proposalValidityDays?: number;
      humanGate?: { highDealThreshold?: number; maxDiscountWithoutApproval?: number; absoluteMaxDiscount?: number };
      activation?: { proposalAutoSendEnabled?: boolean; outboundAutomationEnabled?: boolean; blockers?: string[] };
    };
  }>;
  normalizedRules?: {
    minimumTransaction?: number;
    proposalValidityDays?: number;
    humanGate?: { highDealThreshold?: number; maxDiscountWithoutApproval?: number; absoluteMaxDiscount?: number };
  };
  products?: CatalogProduct[];
  modules?: CatalogModule[];
};

type ModuleForm = {
  id?: string;
  productId: string;
  moduleCode: string;
  name: string;
  description: string;
  standardScope: string;
  pricingUnit: string;
  basePrice: string;
  currency: string;
  readinessStatus: string;
  isMock: boolean;
  active: boolean;
  catalogVersion: string;
};

const emptyForm: ModuleForm = {
  productId: "",
  moduleCode: "",
  name: "",
  description: "",
  standardScope: "",
  pricingUnit: "per program",
  basePrice: "0",
  currency: "IDR",
  readinessStatus: "design",
  isMock: true,
  active: true,
  catalogVersion: "v0.1-mock",
};

function rupiah(value?: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value || 0);
}

export function BusinessRulesPanel({ onAction }: { onAction: (url: string, init?: RequestInit) => Promise<unknown> }) {
  const [payload, setPayload] = useState<RulesResponse>({});
  const [form, setForm] = useState<ModuleForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await onAction("/api/admin/business-rules") as RulesResponse;
      setPayload(result);
      setForm((current) => current.productId ? current : { ...current, productId: result.products?.[0]?.id || "" });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Katalog belum dapat dimuat.");
    } finally {
      setLoading(false);
    }
  }, [onAction]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const productById = useMemo(() => new Map((payload.products || []).map((product) => [product.id, product])), [payload.products]);
  const editModule = (module: CatalogModule) => setForm({
    id: module.id,
    productId: module.product_id,
    moduleCode: module.module_code,
    name: module.name,
    description: module.description || "",
    standardScope: module.standard_scope || "",
    pricingUnit: module.pricing_unit,
    basePrice: String(module.base_price),
    currency: module.currency,
    readinessStatus: module.readiness_status,
    isMock: module.is_mock,
    active: module.active,
    catalogVersion: module.catalog_version,
  });

  const resetForm = () => setForm({ ...emptyForm, productId: payload.products?.[0]?.id || "" });
  const save = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await onAction("/api/admin/business-rules", {
        method: "POST",
        body: JSON.stringify({ ...form, basePrice: Number(form.basePrice) }),
      });
      setMessage(form.id ? "Perubahan modul tersimpan." : "Modul baru ditambahkan.");
      resetForm();
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Modul gagal disimpan.");
    } finally {
      setSaving(false);
    }
  };

  const selected = payload.selectedRuleSet;
  const rules = payload.normalizedRules;
  const confirmedDraft = payload.ruleSets?.find((ruleSet) => ruleSet.status === "draft" && ruleSet.is_mock === false);
  const activationBlockers = confirmedDraft?.rules?.activation?.blockers || [];

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border p-5 ${selected?.is_mock ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-3">
            {selected?.is_mock ? <ShieldAlert className="mt-0.5 text-amber-700" size={20} /> : <CheckCircle2 className="mt-0.5 text-emerald-700" size={20} />}
            <div>
              <p className="text-sm font-bold text-slate-900">Business Rules {selected?.version || "belum tersedia"}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {selected?.is_mock
                  ? "Mode simulasi aktif. Harga mock tidak dapat dikirim sebagai penawaran resmi. Ganti setiap modul dengan data yang telah disepakati."
                  : "Rules aktif menggunakan katalog riil. Proposal tetap mengikuti human gate dan batas komersial."}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-right text-xs">
            <div><p className="text-slate-500">Minimum</p><p className="font-bold text-slate-900">{rupiah(rules?.minimumTransaction)}</p></div>
            <div><p className="text-slate-500">Review nilai</p><p className="font-bold text-slate-900">{rupiah(rules?.humanGate?.highDealThreshold)}</p></div>
            <div><p className="text-slate-500">Masa berlaku</p><p className="font-bold text-slate-900">{rules?.proposalValidityDays || 0} hari</p></div>
          </div>
        </div>
      </div>

      {confirmedDraft && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 text-[#0B2C6B]" size={20} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-slate-900">Business Rules {confirmedDraft.version}</p>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-[#0B2C6B]">Draft aman</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Keputusan yang sudah terkonfirmasi telah tersimpan, tetapi belum menggantikan rules aktif. Proposal otomatis dan outbound tetap terkunci sampai seluruh blocker ditutup.
              </p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
                <span>Minimum transaksi: <strong>{rupiah(confirmedDraft.rules?.minimumTransaction)}</strong></span>
                <span>Review nilai: <strong>{rupiah(confirmedDraft.rules?.humanGate?.highDealThreshold)}</strong></span>
                <span>Diskon tanpa approval: <strong>{confirmedDraft.rules?.humanGate?.maxDiscountWithoutApproval ?? 0}%</strong></span>
                <span>Masa berlaku: <strong>{confirmedDraft.rules?.proposalValidityDays ?? 0} hari</strong></span>
              </div>
              {activationBlockers.length > 0 && (
                <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {activationBlockers.map((blocker) => (
                    <div key={blocker} className="rounded-lg border border-blue-100 bg-white px-3 py-2 text-xs text-slate-600">
                      {blocker.replaceAll("_", " ")}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div><h2 className="text-sm font-bold text-slate-900">Katalog Modul</h2><p className="text-xs text-slate-500">Produk adalah payung; harga ditetapkan pada setiap modul.</p></div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{payload.modules?.length || 0} modul</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500"><Loader2 className="animate-spin" size={16} /> Memuat katalog…</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {(payload.modules || []).map((module) => (
                <div key={module.id} className="flex items-start justify-between gap-4 px-5 py-4 hover:bg-slate-50/80">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{module.name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${module.is_mock ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{module.is_mock ? "Mock" : "Riil"}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{module.readiness_status}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{productById.get(module.product_id)?.name || "Produk"} · {module.module_code} · {module.catalog_version}</p>
                    <p className="mt-2 text-sm font-bold text-[#0B2C6B]">{rupiah(Number(module.base_price))} <span className="font-normal text-slate-500">/ {module.pricing_unit}</span></p>
                  </div>
                  <button type="button" onClick={() => editModule(module)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:border-[#0B2C6B]/30 hover:text-[#0B2C6B]" aria-label={`Edit ${module.name}`}><Edit3 size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div><h2 className="text-sm font-bold text-slate-900">{form.id ? "Edit Modul" : "Tambah Modul"}</h2><p className="text-xs text-slate-500">Data ini menjadi sumber harga proposal.</p></div>
            {form.id && <button type="button" onClick={resetForm} className="flex items-center gap-1 text-xs font-semibold text-[#0B2C6B]"><Plus size={13} /> Baru</button>}
          </div>
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-600">Produk<select value={form.productId} onChange={(event) => setForm({ ...form, productId: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">{(payload.products || []).map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-semibold text-slate-600">Kode modul<input value={form.moduleCode} onChange={(event) => setForm({ ...form, moduleCode: event.target.value.toUpperCase() })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" placeholder="PLAY_FACILITATION" /></label>
              <label className="block text-xs font-semibold text-slate-600">Versi katalog<input value={form.catalogVersion} onChange={(event) => setForm({ ...form, catalogVersion: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
            </div>
            <label className="block text-xs font-semibold text-slate-600">Nama modul<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
            <label className="block text-xs font-semibold text-slate-600">Scope standar<textarea value={form.standardScope} onChange={(event) => setForm({ ...form, standardScope: event.target.value })} className="mt-1 min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-semibold text-slate-600">Harga<input type="number" min="0" value={form.basePrice} onChange={(event) => setForm({ ...form, basePrice: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
              <label className="block text-xs font-semibold text-slate-600">Satuan<input value={form.pricingUnit} onChange={(event) => setForm({ ...form, pricingUnit: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
            </div>
            <label className="block text-xs font-semibold text-slate-600">Kesiapan<select value={form.readinessStatus} onChange={(event) => setForm({ ...form, readinessStatus: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">{["research", "design", "development", "testing", "ready", "retired"].map((value) => <option key={value}>{value}</option>)}</select></label>
            <div className="flex gap-5 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-700">
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.isMock} onChange={(event) => setForm({ ...form, isMock: event.target.checked })} /> Data mock</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Aktif</label>
            </div>
            <button type="button" disabled={saving || !form.productId || !form.moduleCode || !form.name} onClick={() => void save()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B2C6B] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />} Simpan Modul
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
