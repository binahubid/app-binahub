import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IndividualTrial } from './individual-trial';
import type { TrialDefinition, TrialProduct } from '@/lib/individual-trial';
const auth = vi.hoisted(() => ({ session: { user: { id: 'demo-admin' }, access_token: 'synthetic' }, change: null as null | ((e: string, session: unknown) => void) }));
vi.mock('@/lib/supabase', () => ({ supabase: { auth: { getSession: async () => ({ data: { session: auth.session } }), onAuthStateChange: (callback: typeof auth.change) => { auth.change = callback; return { data: { subscription: { unsubscribe() {} } } }; } } } }));
function source(product: TrialProduct): TrialDefinition {
  const sr = product === 'pe' ? 24 : 27, sj = product === 'pe' ? 12 : 13;
  return { demo: true, product, revision: 'a'.repeat(64), offer: { title: product === 'pe' ? 'Personal Effectiveness' : 'Relationship Management', price: product === 'pe' ? 59000 : 89000, selfReport: sr, sjt: sj },
    definition: { title: product, selfReportScale: [{ value: 5, label: 'Hampir selalu' }], selfReportItems: Array.from({ length: sr }, (_, i) => ({ id: `SR${i}`, prompt: `Synthetic pengalaman ${i}` })), sjtItems: Array.from({ length: sj }, (_, i) => ({ id: `SJ${i}`, scenario: `Synthetic situasi ${i}`, question: 'Apa tindakan yang Anda pilih?', options: [{ id: 'A', text: `Pilihan A ${i}` }, { id: 'B', text: `Pilihan B ${i}` }] })) } };
}
let failSubmit = false, failNetwork = false;
const calls: { path: string; body?: Record<string, unknown> }[] = [];
beforeEach(() => {
  sessionStorage.clear(); calls.length = 0; failSubmit = false; failNetwork = false;
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ path: url, body });
    if (body) {
      if (failNetwork) throw new TypeError('Failed to fetch');
      if (failSubmit) return Response.json({ success: false, error: 'Server sementara belum tersedia. Coba lagi.' }, { status: 503 });
      return Response.json({ success: true, report: { demo: true, product: body.product, title: source(body.product).offer.title, generatedAt: '', notice: 'Synthetic result', methodNote: 'Bobot sementara 50:50', moduleProfile: { combined: 50, selfReport: 100, sjt: 0 }, areas: [{ code: 'test', name: 'Communication', selfReport: 100, sjt: body.product === 'rm' ? null : 0, combined: body.product === 'rm' ? null : 50 }], nextSteps: ['Langkah uji'] } });
    }
    return Response.json({ success: true, ...source(url.endsWith('rm') ? 'rm' : 'pe') });
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
async function start(product: TrialProduct) {
  render(<IndividualTrial />);
  fireEvent.click(screen.getAllByRole('button', { name: 'Coba paket' })[product === 'pe' ? 0 : 1]);
  await screen.findByRole('heading', { name: 'Ringkasan pesanan' });
  fireEvent.click(screen.getByRole('button', { name: 'Simulasikan pembayaran gagal' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Tidak ada tagihan');
  fireEvent.click(screen.getByRole('button', { name: /Simulasikan pembayaran berhasil/ }));
  expect(screen.getByRole('button', { name: /Mulai Self Diagnostic/ })).toBeDisabled();
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: /Mulai Self Diagnostic/ }));
}
describe('PE/RM admin demo journey', () => {
  it.each(['pe', 'rm'] as const)('completes %s with full bank, payment simulation and server-only report', async product => {
    await start(product);
    const count = product === 'pe' ? 36 : 40, sr = product === 'pe' ? 24 : 27;
    expect(screen.getByRole('button', { name: 'Lanjut' })).toBeDisabled();
    for (let i = 0; i < count; i++) {
      fireEvent.click(screen.getAllByRole('radio')[0]);
      fireEvent.click(screen.getByRole('button', { name: i === count - 1 ? 'Tinjau jawaban' : 'Lanjut' }));
    }
    expect(screen.getByRole('heading', { name: 'Tinjau jawaban Anda.' })).toBeInTheDocument();
    expect(calls.filter(c => c.body)).toHaveLength(0); // Checkout/Next never creates an external payment or server write.
    expect(screen.queryByText('Pilihan B 0')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ubah jawaban 1' }));
    expect(screen.getByRole('radio')).toBeChecked();
    // Restore review via the final question, without answering differently.
    const stored = JSON.parse(sessionStorage.getItem(`binahub.individual-demo.demo-admin.${product}`)!);
    expect(Object.keys(stored.responses)).toHaveLength(count);
    cleanup();
    sessionStorage.setItem(`binahub.individual-demo.demo-admin.${product}`, JSON.stringify({ ...stored, stage: 'review' }));
    render(<IndividualTrial />); fireEvent.click(screen.getAllByRole('button', { name: 'Coba paket' })[product === 'pe' ? 0 : 1]);
    await screen.findByRole('heading', { name: 'Tinjau jawaban Anda.' });
    failSubmit = true; fireEvent.click(screen.getByRole('button', { name: 'Kirim dan lihat hasil' }));
    await screen.findByRole('alert'); expect(screen.getByRole('alert')).toHaveTextContent('Coba lagi');
    failSubmit = false; failNetwork = true; fireEvent.click(screen.getByRole('button', { name: 'Kirim dan lihat hasil' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Jawaban di tab ini tetap tersedia'));
    expect(Object.keys(JSON.parse(sessionStorage.getItem(`binahub.individual-demo.demo-admin.${product}`)!).responses)).toHaveLength(count);
    failNetwork = false; fireEvent.click(screen.getByRole('button', { name: 'Kirim dan lihat hasil' }));
    await screen.findByRole('heading', { name: 'Ringkasan pengembangan Anda.' });
    const submission = calls.filter(c => c.body).at(-1)!.body!;
    expect(Object.keys(submission.responses as object)).toHaveLength(count); expect(submission).not.toHaveProperty('paymentStatus');
    expect(screen.getByText('Skor gabungan')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Area Pengembangan' })).toBeInTheDocument();
    expect(source(product).definition.selfReportItems).toHaveLength(sr);
    expect(calls.every(c => c.path.startsWith('/api/admin/assessments/individual/trial'))).toBe(true);
  });
  it('fails closed on session change and clears visible state/drafts', async () => {
    await start('pe'); fireEvent.click(screen.getByRole('radio'));
    auth.change?.('SIGNED_OUT', null);
    await waitFor(() => expect(screen.queryByText('Synthetic pengalaman 0')).not.toBeInTheDocument());
    expect(sessionStorage.getItem('binahub.individual-demo.demo-admin.pe')).toBeNull();
    expect(screen.getByRole('alert')).toHaveTextContent('Sesi berubah');
  });
});
