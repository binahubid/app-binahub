import { test, expect } from '@playwright/test';
test.skip(!process.env.PLAYWRIGHT_INDIVIDUAL_TRIAL, 'Synthetic loopback component QA only; never bypasses app authentication.');

for (const product of ['pe', 'rm'] as const) test(`${product}: mock checkout, full bank, recovery and report`, async ({ page }, info) => {
  if (!/^https?:\/\/127\.0\.0\.1:/.test(process.env.PLAYWRIGHT_BASE_URL || '')) throw new Error('Loopback required');
  const sr = product === 'pe' ? 24 : 27, sj = product === 'pe' ? 12 : 13, title = product === 'pe' ? 'Personal Effectiveness' : 'Relationship Management';
  const names = product === 'pe' ? ['Self-Awareness', 'Self-Development', 'Initiative', 'Adaptability', 'Accountability', 'Pressure Management'] : ['Communication', 'Presentation & Public Speaking', 'Professional Presence', 'Relationship Building', 'Trust Building', 'Collaboration', 'Influencing', 'Conflict Management', 'Customer Orientation'];
  const calls: string[] = [];
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.hostname !== '127.0.0.1') throw new Error('External network forbidden during demo QA');
    if (!url.pathname.startsWith('/api/')) return route.continue();
    expect(url.pathname).toBe('/api/admin/assessments/individual/trial'); calls.push(route.request().method());
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON(); expect(body.product).toBe(product); expect(Object.keys(body.responses)).toHaveLength(sr + sj);
      return route.fulfill({ json: { success: true, report: { demo: true, product, title, generatedAt: '', notice: 'Hasil sintetis untuk memeriksa tampilan. Bobot gabungan sementara 50:50.', methodNote: product === 'rm' ? 'Skor studi kasus tersedia untuk modul, bukan per kompetensi. Bobot per kompetensi belum ditetapkan CEO.' : 'Gabungan dari kedua metode. Bukti belum cukup tidak diperlakukan sebagai nol.', moduleProfile: { combined: 62.5, selfReport: 75, sjt: 50 }, areas: names.map((name, i) => ({ code: `test-${i}`, name, selfReport: 75, sjt: product === 'rm' ? null : 50, combined: product === 'rm' ? null : 62.5 })), nextSteps: ['Pilih satu kompetensi untuk dilatih dalam situasi nyata.', 'Catat tindakan, hasil, dan umpan balik.', 'Tinjau kembali kompetensi Anda dalam satu bulan.'] } } });
    }
    return route.fulfill({ json: { success: true, demo: true, product, revision: 'a'.repeat(64), offer: { title, price: product === 'pe' ? 59000 : 89000, selfReport: sr, sjt: sj }, definition: { title, selfReportScale: [{ value: 1, label: 'Hampir tidak pernah' }, { value: 3, label: 'Kadang-kadang' }, { value: 5, label: 'Hampir selalu' }], selfReportItems: Array.from({ length: sr }, (_, i) => ({ id: `SR${i}`, prompt: `Contoh sintetis ${i + 1}: Saya menyepakati prioritas dan memeriksa kembali hasil pekerjaan saya.` })), sjtItems: Array.from({ length: sj }, (_, i) => ({ id: `SJ${i}`, scenario: `Situasi sintetis ${i + 1}. Tim Anda menghadapi perubahan rencana dan perlu menyepakati langkah berikutnya bersama pihak terkait.`, question: 'Apa tindakan yang Anda pilih?', options: ['A', 'B', 'C', 'D'].map(id => ({ id, text: `${id}: Pilihan sintetis untuk memeriksa tampilan dan navigasi.` })) })) } } });
  });
  await page.setViewportSize(info.project.name === 'chromium' ? { width: 1440, height: 1000 } : { width: 390, height: 844 });
  await page.goto('/'); await page.getByRole('button', { name: 'Coba paket' }).nth(product === 'pe' ? 0 : 1).click();
  await expect(page.getByRole('heading', { name: 'Ringkasan pesanan' })).toBeVisible();
  await page.screenshot({ path: `.impeccable/review/individual-trial-${product}-checkout-${info.project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Simulasikan pembayaran gagal' }).click(); await expect(page.getByRole('alert')).toContainText('Tidak ada tagihan');
  await page.getByRole('button', { name: 'Simulasikan pembayaran berhasil' }).click(); await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Mulai Self Diagnostic' }).click();
  await page.getByRole('radio').last().check(); await page.getByRole('button', { name: 'Lanjut', exact: true }).click();
  await page.reload(); await page.getByRole('button', { name: 'Coba paket' }).nth(product === 'pe' ? 0 : 1).click();
  await expect(page.getByRole('heading', { name: 'Pertanyaan 2', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Kembali', exact: true }).click(); await expect(page.getByRole('radio').last()).toBeChecked();
  await page.screenshot({ path: `.impeccable/review/individual-trial-${product}-question-${info.project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Lanjut', exact: true }).click();
  for (let i = 1; i < sr + sj; i++) { await page.getByRole('radio').last().check(); await page.getByRole('button', { name: i === sr + sj - 1 ? 'Tinjau jawaban' : 'Lanjut', exact: true }).click(); }
  expect(calls.filter(c => c === 'POST')).toHaveLength(0);
  await page.getByRole('button', { name: 'Lihat jawaban berikutnya' }).click();
  await page.getByRole('button', { name: 'Kirim dan lihat hasil' }).click(); await expect(page.getByRole('heading', { name: 'Ringkasan pengembangan Anda.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Area Pengembangan' })).toBeVisible();
  const labels = page.locator('li dl dt');
  await expect(labels.first()).toHaveText('Gabungan');
  expect(await labels.first().evaluate(el => getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden')).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `.impeccable/review/individual-trial-${product}-${info.project.name}.png`, fullPage: true });
  await page.setViewportSize({ width: 320, height: 844 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.getByRole('link', { name: /PDF|unduh/i })).toHaveCount(0);
});
