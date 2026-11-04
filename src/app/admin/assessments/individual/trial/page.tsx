import { AdminShell } from '@/components/admin-shell';
import { IndividualTrial } from '@/components/individual-trial';
export default function Page() {
  return <AdminShell eyebrow="Self Diagnostic" title="Uji coba paket individu" description="Jalani alur PE dan RM dengan simulasi pembayaran, soal asli, dan skor yang dihitung di server."><IndividualTrial /></AdminShell>;
}
