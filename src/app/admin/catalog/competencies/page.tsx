import { AdminAuthGate } from "@/components/admin-auth-gate";
import { AdminShell } from "@/components/admin-shell";
import { CompetencyDictionary } from "@/components/competency-dictionary";

export default function AdminCompetencyPage() {
  return <AdminAuthGate><AdminShell eyebrow="Program & Produk" title="Kamus kompetensi"
    description="Tinjau kompetensi dan pemetaannya ke solusi BinaHub.">
    <CompetencyDictionary />
  </AdminShell></AdminAuthGate>;
}
