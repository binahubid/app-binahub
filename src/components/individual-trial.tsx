"use client";
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { restoreTrialDraft, trialMoney, trialQuestions, trialSelectedAnswer,
  type TrialAnswer, type TrialDefinition, type TrialDraft, type TrialProduct, type TrialReport } from '@/lib/individual-trial';
import styles from './individual-trial.module.css';

const offers = [{ id: 'pe', name: 'Personal Effectiveness', price: 59000, count: '24 pengalaman nyata · 12 studi kasus' },
  { id: 'rm', name: 'Relationship Management', price: 89000, count: '27 pengalaman nyata · 13 studi kasus' }] as const;
const score = (n: number | null) => n === null ? 'Bukti belum cukup' : n.toLocaleString('id-ID', { maximumFractionDigits: 2 });
const key = (owner: string, product: TrialProduct) => `binahub.individual-demo.${owner}.${product}`;

export function IndividualTrial() {
  const [definition, setDefinition] = useState<TrialDefinition | null>(null);
  const [draft, setDraft] = useState<TrialDraft | null>(null);
  const [report, setReport] = useState<TrialReport | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [storageWarning, setStorageWarning] = useState('');
  const [stale, setStale] = useState(false), [consent, setConsent] = useState(false), [reviewCount, setReviewCount] = useState(6);
  const [method, setMethod] = useState('qris'), [resetConfirm, setResetConfirm] = useState(false), [expired, setExpired] = useState(false);
  const owner = useRef(''), lock = useRef(false), generation = useRef(0), heading = useRef<HTMLHeadingElement>(null);
  const questions = definition ? trialQuestions(definition) : [];
  const answered = draft ? questions.filter(q => Object.hasOwn(draft.responses, q.id)).length : 0;

  useEffect(() => {
    const lifecycle = generation;
    const listener = supabase.auth.onAuthStateChange((_event, session) => {
      if (owner.current && session?.user.id !== owner.current) {
        for (const product of ['pe', 'rm'] as const) try { sessionStorage.removeItem(key(owner.current, product)); } catch {}
        generation.current++; setDefinition(null); setDraft(null); setReport(null); setExpired(true);
        setError('Sesi berubah. Masuk kembali sebagai admin sebelum melanjutkan.');
      }
    });
    return () => { lifecycle.current++; listener.data.subscription.unsubscribe(); };
  }, []);
  useEffect(() => { if (definition) heading.current?.focus(); }, [definition, draft?.index, draft?.stage, report]);

  async function request<T>(path: string, body?: unknown): Promise<T> {
    const { data } = await supabase.auth.getSession();
    if (!data.session || (owner.current && data.session.user.id !== owner.current)) throw new Error('Sesi berakhir. Silakan masuk kembali.');
    owner.current = data.session.user.id;
    let response: Response;
    try {
      response = await fetch(`/api/admin/assessments/individual/trial${path}`, { method: body ? 'POST' : 'GET', cache: 'no-store',
        headers: { Authorization: `Bearer ${data.session.access_token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(25000) });
    } catch {
      throw new Error('Koneksi terputus atau waktu tunggu habis. Jawaban di tab ini tetap tersedia. Periksa koneksi lalu coba lagi.');
    }
    const payload = await response.json().catch(() => null);
    const current = await supabase.auth.getSession();
    if (current.data.session?.user.id !== data.session.user.id) throw new Error('Sesi berubah. Muat ulang halaman.');
    if (!response.ok || payload?.success !== true) {
      if (payload?.code === 'TRIAL_SOURCE_CHANGED') setStale(true);
      throw new Error(payload?.error || 'Belum dapat terhubung. Coba kembali; jawaban di tab ini tidak dihapus.');
    }
    return payload;
  }
  async function run(action: () => Promise<void>) {
    if (lock.current) return; lock.current = true; setBusy(true); setError('');
    try { await action(); } catch (e) { setError(e instanceof Error ? e.message : 'Belum berhasil. Silakan coba lagi.'); }
    finally { lock.current = false; setBusy(false); }
  }
  function persist(next: TrialDraft, product = definition?.product) {
    setDraft(next);
    if (!product || !owner.current) return;
    try { sessionStorage.setItem(key(owner.current, product), JSON.stringify(next)); }
    catch { setStorageWarning('Penyimpanan tab tidak tersedia. Jangan tutup atau muat ulang tab selama uji coba.'); }
  }
  async function choose(product: TrialProduct, restart = false) {
    await run(async () => {
      const current = ++generation.current;
      const d = await request<TrialDefinition>(`?product=${product}`);
      if (generation.current !== current) return;
      let saved: TrialDraft | null = null;
      if (!restart) try { saved = restoreTrialDraft(sessionStorage.getItem(key(owner.current, product)), d); } catch {}
      setDefinition(d); setReport(null); setConsent(false); setStale(false); setReviewCount(6); setResetConfirm(false);
      persist(saved || { revision: d.revision, expiresAt: Date.now() + 86400000, stage: 'checkout', index: 0, responses: {} }, product);
    });
  }
  function move(stage: TrialDraft['stage'], index = draft?.index || 0) {
    if (draft) persist({ ...draft, stage, index });
  }
  async function submit() {
    if (!definition || !draft || answered !== questions.length || stale) return;
    await run(async () => {
      const current = generation.current;
      const result = await request<{ report: TrialReport }>('', { product: definition.product, revision: definition.revision, responses: draft.responses });
      if (generation.current === current) setReport(result.report);
    });
  }
  const step = report ? 3 : draft?.stage === 'checkout' ? 1 : draft ? 2 : 0;
  const question = draft ? questions[draft.index] : null;
  const choices = question?.options?.map(o => ({ value: o.id as TrialAnswer, label: o.text })) || definition?.definition.selfReportScale || [];

  return <div className={styles.root}>
    <Link href="/admin/assessments/individual" className={styles.back}><ArrowLeft size={16} aria-hidden="true" />Diagnosis individu</Link>
    <p className={styles.notice}><strong>Mode uji coba admin.</strong> Pembayaran hanya simulasi—tidak ada uang ditagih, email dikirim, atau hak akses berbayar diterbitkan. Gunakan jawaban uji, bukan data peserta.</p>
    <ol className={styles.steps} aria-label="Alur uji coba">{['Pilih paket', 'Pembayaran', 'Self Diagnostic', 'Hasil'].map((label, i) => <li key={label} aria-current={step === i ? 'step' : undefined}><span>{i + 1}</span>{label}</li>)}</ol>
    {error && <div role="alert" className={styles.error}>{error}{stale && definition && <button className={styles.secondary} disabled={busy} onClick={() => void choose(definition.product, true)}>Mulai versi terbaru</button>}</div>}
    {storageWarning && <p role="status" className={styles.error}>{storageWarning}</p>}
    {!definition ? <section aria-labelledby="trial-packages"><h2 id="trial-packages">Pilih paket untuk dicoba.</h2><p className={styles.muted}>Harga yang ditampilkan mengikuti rencana paket. Penjualan publik masih Coming soon.</p>
      <div className={styles.packages}>{offers.map(o => <div className={styles.package} key={o.id}><div><h3>{o.name}</h3><p>{o.count}</p></div><strong>{trialMoney(o.price)}</strong><button className={styles.primary} disabled={busy || expired} onClick={() => void choose(o.id)}>{busy ? 'Memuat…' : 'Coba paket'}<ArrowRight size={16} aria-hidden="true" /></button></div>)}</div>
      <p className={styles.footnote}>Soal diambil dari bank instrumen yang terpasang. Jika sumbernya belum tersedia, demo berhenti dengan pesan yang jelas, bukan mengganti soal dengan contoh buatan.</p>
    </section> : draft && <>
      <div className={styles.packageHeading}><div><h2>{definition.offer.title}</h2><p className={styles.muted}>{definition.offer.selfReport} pertanyaan pengalaman nyata dan {definition.offer.sjt} studi kasus.</p></div><button className={styles.secondary} disabled={busy} onClick={() => { setDefinition(null); setDraft(null); setReport(null); setError(''); }}>Ganti paket</button></div>
      {draft.stage === 'checkout' ? <section className={styles.checkout} aria-label="Simulasi pembayaran">
        <div><h3 ref={heading} tabIndex={-1}>Ringkasan pesanan</h3><dl className={styles.order}><div><dt>Paket</dt><dd>{definition.offer.title}</dd></div><div><dt>Harga rencana</dt><dd>{trialMoney(definition.offer.price)}</dd></div><div className={styles.total}><dt>Ditagih sekarang</dt><dd>Rp0 · simulasi</dd></div></dl><p className={styles.muted}>Tidak perlu memasukkan nama, email, rekening, atau data kartu.</p></div>
        <div><fieldset className={styles.paymentMethods}><legend>Metode pembayaran contoh</legend>{[['qris', 'QRIS'], ['va', 'Virtual account']].map(([value, label]) => <label key={value}><input type="radio" name="trial-payment" value={value} checked={method === value} onChange={() => setMethod(value)} />{label}<span>Simulasi</span></label>)}</fieldset><p className={styles.footnote}>Tidak ada QR, nomor rekening, maupun koneksi Mayar sungguhan pada halaman ini.</p><button className={styles.primary} onClick={() => { setError(''); move('paid'); }}>Simulasikan pembayaran berhasil<ArrowRight size={16} aria-hidden="true" /></button><button className={styles.textButton} onClick={() => setError('Simulasi: pembayaran belum berhasil. Tidak ada tagihan. Pilih simulasi berhasil untuk melanjutkan.')}>Simulasikan pembayaran gagal</button></div>
      </section> : report ? <TrialResult report={report} heading={heading} onReset={() => setResetConfirm(true)} /> : draft.stage === 'paid' ? <section className={styles.panel}>
        <h3 ref={heading} tabIndex={-1}>Simulasi berhasil. Paket siap dicoba.</h3><p className={styles.muted}>Pada alur berbayar nanti, konfirmasi pembayaran membuka akses paket. Saat ini tidak ada transaksi sungguhan.</p><h4>Sebelum memulai</h4><ul className={styles.instructions}><li>Jawablah sesuai pengalaman nyata dalam tiga bulan terakhir dan tindakan yang Anda pilih.</li><li>Tidak perlu mencari jawaban yang terasa paling ideal. Semua pertanyaan perlu dijawab.</li><li>Anda dapat mengubah jawaban dengan menekan tombol Kembali sebelum mengirim.</li><li>Hasil membantu refleksi pengembangan diri, bukan diagnosis klinis atau dasar tunggal seleksi/promosi.</li></ul>
        <label className={styles.consent}><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />Saya memahami ini uji coba dan akan memakai jawaban uji, bukan data peserta.</label><button className={styles.primary} disabled={!consent} onClick={() => move('questions', 0)}>Mulai Self Diagnostic<ArrowRight size={16} aria-hidden="true" /></button>
      </section> : <div className={styles.workspace}>
        <aside className={styles.guide}><details open><summary>Petunjuk singkat</summary><p>Jawablah sesuai pengalaman dan pilihan Anda yang sebenarnya.</p><p>Anda dapat mengubah jawaban dengan menekan tombol Kembali sebelum mengirim.</p></details><p className={styles.footnote}>Draft demo tersimpan di tab browser ini, maksimal 24 jam. Bukan rekaman peserta atau arsip hasil.</p></aside>
        <section className={styles.panel} aria-busy={busy}>
          <div className={styles.progressLabel}><span>{answered} dari {questions.length} terjawab</span><span>Uji coba</span></div><progress className={styles.progress} max={questions.length} value={answered} aria-label="Kemajuan pengisian" />
          {draft.stage === 'questions' && question ? <div key={question.id} className={styles.question}>
            <h3 ref={heading} tabIndex={-1}>Pertanyaan {draft.index + 1}</h3>{question.scenario && <p className={styles.scenario}>{question.scenario}</p>}
            <fieldset className={styles.answers}><legend>{question.prompt || question.question}</legend>{choices.map(o => <label key={o.value} className={draft.responses[question.id] === o.value ? styles.selected : ''}><input type="radio" name={question.id} value={o.value} checked={draft.responses[question.id] === o.value} onChange={() => { setError(''); persist({ ...draft, responses: { ...draft.responses, [question.id]: o.value } }); }} /><span>{o.label}</span>{draft.responses[question.id] === o.value && <Check size={18} aria-hidden="true" />}</label>)}</fieldset>
            <div className={styles.actions}><button className={styles.secondary} disabled={draft.index === 0} onClick={() => move('questions', draft.index - 1)}><ArrowLeft size={16} aria-hidden="true" />Kembali</button><button className={styles.primary} disabled={!Object.hasOwn(draft.responses, question.id)} onClick={() => draft.index === questions.length - 1 ? move('review') : move('questions', draft.index + 1)}>{draft.index === questions.length - 1 ? 'Tinjau jawaban' : 'Lanjut'}<ArrowRight size={16} aria-hidden="true" /></button></div>
          </div> : <><h3 ref={heading} tabIndex={-1}>Tinjau jawaban Anda.</h3><p className={styles.muted}>Hanya jawaban yang dipilih ditampilkan. Setelah dikirim, lihat skor gabungan dan rincian kedua metode.</p><ol className={styles.review}>{questions.slice(0, reviewCount).map((q, i) => <li key={q.id}><h4>{i + 1}. {q.prompt || q.question}</h4>{q.scenario && <p>{q.scenario}</p>}<p className={styles.reviewAnswer}>{trialSelectedAnswer(definition, q, draft.responses[q.id]) || 'Belum dijawab'}</p><button className={styles.textButton} disabled={busy} onClick={() => move('questions', i)}>Ubah jawaban {i + 1}</button></li>)}</ol>{reviewCount < questions.length && <div className={styles.more}><button className={styles.secondary} disabled={busy} onClick={() => setReviewCount(n => n + 6)}>Lihat jawaban berikutnya</button></div>}<div className={styles.actions}><button className={styles.secondary} disabled={busy} onClick={() => move('questions', questions.length - 1)}>Kembali</button><button className={styles.primary} disabled={busy || answered !== questions.length || stale} onClick={() => void submit()}>{busy ? <><Loader2 size={18} className={styles.spinner} aria-hidden="true" />Menghitung hasil…</> : 'Kirim dan lihat hasil'}</button></div></>}
        </section>
      </div>}
      {resetConfirm && <section className={styles.panel} aria-labelledby="trial-reset"><h3 id="trial-reset">Mulai ulang uji coba paket ini?</h3><p className={styles.muted}>Jawaban demo dalam tab ini akan diganti. Tidak ada data peserta yang dihapus.</p><div className={styles.actions}><button className={styles.secondary} disabled={busy} onClick={() => setResetConfirm(false)}>Batal</button><button className={styles.primary} disabled={busy} onClick={() => void choose(definition.product, true)}>Ya, mulai ulang</button></div></section>}
    </>}
  </div>;
}

function TrialResult({ report, heading, onReset }: { report: TrialReport; heading: React.RefObject<HTMLHeadingElement | null>; onReset: () => void }) {
  return <section className={styles.result} aria-label="Hasil uji coba">
    <header><h3 ref={heading} tabIndex={-1}>Ringkasan pengembangan Anda.</h3><p>{report.notice}</p></header>
    <dl className={styles.scores}><div className={styles.combined}><dt>Skor gabungan</dt><dd>{score(report.moduleProfile.combined)}{report.moduleProfile.combined !== null && <small> / 100</small>}</dd><p>Pengalaman nyata 50% + studi kasus 50%</p></div><div><dt>Pengalaman nyata</dt><dd>{score(report.moduleProfile.selfReport)}{report.moduleProfile.selfReport !== null && <small> / 100</small>}</dd></div><div><dt>Studi kasus</dt><dd>{score(report.moduleProfile.sjt)}{report.moduleProfile.sjt !== null && <small> / 100</small>}</dd></div></dl>
    <p className={styles.methodNote}>{report.methodNote}</p><h4>Area Pengembangan</h4>
    <div className={styles.areaHeader} aria-hidden="true"><span>Kompetensi</span><span>Gabungan</span><span>Pengalaman nyata</span><span>Studi kasus</span></div><ul className={styles.areas}>{report.areas.map(a => <li key={a.code}><h5>{a.name}</h5><dl><div><dt>Gabungan</dt><dd>{a.combined === null && report.product === 'rm' ? 'Belum ditetapkan' : score(a.combined)}</dd></div><div><dt>Pengalaman nyata</dt><dd>{score(a.selfReport)}</dd></div><div><dt>Studi kasus</dt><dd>{a.sjt === null && report.product === 'rm' ? 'Lihat skor modul' : score(a.sjt)}</dd></div></dl></li>)}</ul>
    <h4>Langkah pengembangan berikutnya</h4><ol className={styles.instructions}>{report.nextSteps.map(s => <li key={s}>{s}</li>)}</ol><p className={styles.footnote}>Laporan demo tidak dikirim melalui email dan bukan arsip peserta. Rekomendasi program personal serta interpretasi akhir perlu ditinjau terpisah sebelum penjualan publik dibuka.</p><button className={styles.secondary} onClick={onReset}>Ulangi uji coba</button>
  </section>;
}
