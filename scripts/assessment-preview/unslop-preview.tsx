import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { UsersRound } from 'lucide-react';
import { AdminShell } from '@/components/admin-shell';
import { AdminInput, AdminSearch, AdminSelect, AdminTextarea, Badge, EmptyState, FormSection, StatCard } from '@/app/admin/_components/shared';
import '@/app/globals.css';

function UnslopPreview() {
  const [search, setSearch] = useState(''), [name, setName] = useState('Program contoh lokal'), [notes, setNotes] = useState(''), [status, setStatus] = useState('Aktif');
  return <AdminShell eyebrow="Program & Produk" title="Program" description="Pantau program, kelengkapan peserta, dan tindak lanjut tim Anda.">
    <p className="mb-6 text-sm text-slate-600">Pratinjau lokal · data sintetis · tidak terhubung ke layanan produksi</p>
    <div className="grid gap-4 sm:grid-cols-3"><StatCard label="Program aktif" value={12} icon={UsersRound}/><StatCard label="Peserta terdaftar" value={128}/><StatCard label="Perlu tindak lanjut" value={3} tone="gold"/></div>
    <section className="my-6 rounded-2xl border bg-white p-5">
      <h2 className="mb-4 text-lg font-semibold">Daftar program</h2><AdminSearch value={search} onChange={setSearch} placeholder="Cari program"/>
      <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-3">Program</th><th className="p-3">Peserta</th><th className="p-3">Status</th></tr></thead><tbody>{['Kolaborasi Tim', 'Pengembangan Kepemimpinan'].filter(x=>x.toLowerCase().includes(search.toLowerCase())).map(x=><tr key={x} className="border-t"><td className="p-3 font-medium">{x}</td><td className="p-3 tabular-nums">24 karyawan</td><td className="p-3"><Badge tone="green">Aktif</Badge></td></tr>)}</tbody></table></div>
    </section>
    <FormSection title="Informasi program" description="Contoh komponen formulir yang dipakai bersama di workspace admin."><div className="grid gap-4 sm:grid-cols-2"><AdminInput label="Nama program" value={name} onChange={setName}/><label className="block text-sm text-slate-700">Status<AdminSelect value={status} onChange={setStatus} options={['Aktif','Selesai']} ariaLabel="Status program"/></label></div><div className="mt-4"><AdminTextarea label="Catatan pendamping" value={notes} onChange={setNotes}/></div></FormSection>
    <div className="mt-6"><EmptyState title="Belum ada catatan tambahan" description="Catatan akan tampil setelah ditambahkan oleh tim pendamping."/></div>
  </AdminShell>;
}
createRoot(document.getElementById('root')!).render(<UnslopPreview/>);
