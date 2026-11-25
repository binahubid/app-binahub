import assert from "node:assert/strict";
import { createServer } from "node:http";
import { chromium, expect } from "@playwright/test";
import { createElement } from "react";
import { Document, Page, Text, renderToBuffer } from "@react-pdf/renderer";

const origin = "http://127.0.0.1:4390";
const api = "http://127.0.0.1:4389";
const alice = "00000000-0000-4000-8000-000000000001";
const bob = "00000000-0000-4000-8000-000000000002";
const lead = "00000000-0000-4000-8000-000000000003";
const peerLead = "00000000-0000-4000-8000-000000000004";
const proposal = "00000000-0000-4000-8000-000000000005";
const date = "2099-01-01T10:00:00.000Z";
const material = await renderToBuffer(createElement(Document, null,
  ...["pertama", "kedua"].map((label) =>
    createElement(Page, { key: label, size: "A4", style: { padding: 40 } },
      createElement(Text, null, `Contoh halaman ${label} — Versi 3`),
    ),
  ),
));
const user = {
  id: alice,
  email: "alice@example.invalid",
  role: "authenticated",
  aud: "authenticated",
  app_metadata: { role: "consultant" },
  user_metadata: { full_name: "Alicia Konsultan" },
};
const jwtPart = (data) =>
  Buffer.from(JSON.stringify(data)).toString("base64url");
const accessToken = `${jwtPart({ alg: "HS256", typ: "JWT" })}.${jwtPart({ sub: alice, exp: 4102444800, role: "authenticated" })}.synthetic`;
const fixture = {
  access_token: accessToken,
  token_type: "bearer",
  refresh_token: "synthetic",
  expires_at: 4102444800,
  expires_in: 86400,
  user,
};
const definition = {
  version: "synthetic",
  stages: ["Konteks", "Tantangan", "Dampak", "Sasaran", "Kesiapan"],
  fields: [
    {
      key: "example",
      questionId: "Q01",
      label: "Konteks kebutuhan",
      type: "text",
      required: false,
    },
    { key: "challenge", questionId: "Q04", label: "Tantangan utama", type: "text", maxLength: 500, required: true },
  ],
  screens: [["Q01"], [], [], ["Q04"]],
};
const members = [
  { id: alice, name: "Alicia Konsultan", active: true },
  { id: bob, name: "Budi Konsultan", active: true },
];
const record = {
  id: lead,
  company: "PT Uji Konsultasi",
  name: "Klien Simulasi",
  email: "client@example.invalid",
  phone: "0800000000",
  stage: "consultation",
  assigneeId: alice,
  assigneeName: members[0].name,
  version: 1,
  checklistStatus: "in_progress",
  canEdit: true,
  handoff: null,
  origin: { kind: "recommendation", label: "Rekomendasi Program", status: "recorded" },
};
const readOnly = {
  ...record,
  id: peerLead,
  company: "PT Agenda Tim",
  assigneeId: bob,
  assigneeName: members[1].name,
  origin: { kind: "assessment_team", label: "Diagnosis Tim / Organisasi", status: "recorded" },
  canEdit: false,
};
const catalog = [
  {
    code: "SS-01",
    name: "Program Kepemimpinan",
    dailyRateIdr: 25000000,
    capacity: "Hingga 30 peserta",
    pricingModel: "Tarif Harian Standar",
  },
];
const testServer = createServer((req, res) => {
  // These server requests come from the real Next.js middleware.
  res.setHeader("Content-Type", "application/json");
  if (req.url === "/auth/v1/user") return res.end(JSON.stringify(user));
  if (req.url === "/api/auth/role")
    return res.end(
      JSON.stringify({
        success: true,
        role: "consultant",
        fullName: user.user_metadata.full_name,
      }),
    );
  res.writeHead(404);
  res.end("{}");
});
await new Promise((resolve) => testServer.listen(4389, "127.0.0.1", resolve));
const browser = await chromium.launch({ channel: "chrome", headless: true });
let checks = 0;

try {
  for (const width of [1440, 1024, 390, 320]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
    });
    await context.addCookies([
      {
        name: "sb-127-auth-token",
        value:
          "base64-" +
          Buffer.from(JSON.stringify(fixture)).toString("base64url"),
        url: origin,
      },
    ]);
    const page = await context.newPage();
    let asAdmin = false, availabilityFailure = false;
    let sessionChecks = 0, defaultReads = 0;
    let personalReads = 0, checklistRevision = 1, answers = {};
    const requests = [];
    const pageErrors = [],
      writes = [];
    const local = { ...record, stage: width === 1440 ? "identified" : record.stage },
      proposals = [],
      messages = [],
      tasks = [];
    const session = () => ({ id: alice, role: asAdmin ? "admin" : "consultant", name: members[0].name, isAdmin: asAdmin });
    const bookings = [
      { id: "scheduled-1", leadId: lead, title: "Konfirmasi waktu konsultasi", company: record.company,
        assigneeName: members[0].name, startTime: date, endTime: "2099-01-01T11:00:00.000Z", status: "requested", meetingUrl: "https://meeting.example.invalid/waiting" },
      { id: "scheduled-2", leadId: lead, title: "Jadwal konsultasi sebelumnya", company: record.company,
        startTime: "2020-11-16T03:00:00.000Z", endTime: "2020-11-16T04:00:00.000Z", status: "confirmed", meetingUrl: "https://meeting.example.invalid/past" },
    ];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.origin === api) requests.push([request.method(), url.pathname, url.search]);
    });
    await page.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (url.origin === origin) return route.continue();
      if (url.origin !== api) return route.abort();
      const method = route.request().method();
      const headers = {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
      };
      const reply = (json, status = 200) =>
        route.fulfill({ json, status, headers });
      if (method === "OPTIONS")
        return route.fulfill({
          status: 204,
          headers: {
            ...headers,
            "Access-Control-Allow-Headers":
              "authorization,content-type,x-request-id",
          },
        });
      const path = url.pathname;
      if (path.startsWith("/auth/v1/")) return reply(user);
      if (path.startsWith("/api/telemetry/")) return reply({ success: true });
      assert.equal(
        (await route.request().allHeaders()).authorization,
        `Bearer ${accessToken}`,
        path,
      );
      if (asAdmin && path === "/api/admin/consultants" && url.searchParams.get("view") === "assignees") {
        return availabilityFailure
          ? reply({ error: "Daftar akun AMS belum dapat diperiksa." }, 503)
          : reply({ members: [{ id: alice, name: members[0].name }] });
      }
      if (path.startsWith("/api/admin"))
        throw new Error("Consultant UI called an admin API");
      if (path === "/api/konsultan/session") {
        sessionChecks++;
        return reply(session());
      }
      if (path === "/api/konsultan") {
        if (!url.search) defaultReads++;
        const owner = url.searchParams.get("owner");
        if (owner === "mine" && !url.searchParams.get("search")) {
          personalReads++;
          if (personalReads === 1) await new Promise(resolve => setTimeout(resolve, 750));
        }
        const records =
          owner === "mine"
            ? [local]
            : owner === bob
              ? [readOnly]
              : [local, readOnly];
        return reply({
          ...(owner === "mine" ? { session: session() } : {}),
          records,
          members,
          catalog,
          page: 0,
          pageSize: 20,
          total: records.length,
          summary: {
            active: records.length,
            overdue: 0,
            proposals: proposals.length,
            handoffs: 0,
          },
          tasks,
          bookings: bookings.slice(0, 1),
        });
      }
      if (path === "/api/konsultan/agenda") {
        const diary = url.searchParams.get("kind") === "bookings" ? bookings : tasks.filter(item => item.status === "open");
        return reply({ records: diary, total: diary.length, pageSize: 20 });
      }
      const read = path.includes(peerLead),
        current = read ? readOnly : local;
      if (method !== "GET") {
        assert(!read, "Read-only detail must not mutate");
        const body = route.request().postDataJSON();
        writes.push(body);
        if (path.endsWith("/proposals")) {
          proposals.push({
            id: proposal,
            revision: 1,
            status: "draft",
            checklist_revision: checklistRevision,
            created_at: date,
            snapshot: {
              programs: [{ ...catalog[0], total: 50000000 }],
              days: 2,
              participants: 20,
              venue: "indoor",
              location: "Jakarta",
              total: 50000000,
              priceNote: "Estimasi program",
            },
          });
          return reply(proposals[0]);
        }
        if (path.endsWith("/messages")) {
          messages.push({
            id: body.id,
            proposal_id: body.proposalId,
            kind: body.kind,
            status: "queued",
            scheduled_at: body.scheduledAt,
            envelope: {
              subject: body.subject,
              body: body.body,
              senderName: members[0].name,
              to: local.email,
            },
          });
          return reply({ message: messages[0] }, 202);
        }
        if (body.action === "task")
          tasks.push({
            id: body.id,
            lead_id: lead,
            due_at: body.dueAt,
            title: body.title,
            status: "open",
            revision: 1,
          });
        if (body.action === "complete_task") tasks[0].status = "completed";
        if (body.action === "cancel_message") messages[0].status = "cancelled";
        if (body.action === "handoff") {
          local.stage = "won";
          local.handoff = { note: body.note, requestedAt: date };
        }
        if (path.endsWith("/meeting")) {
          current.checklistStatus = body.status;
          answers = body.answers;
          checklistRevision++;
        }
        current.version++;
      }
      if (path.endsWith("/meeting"))
        return reply({
          checklist: {
            id: current.id,
            contact: {
              name: current.name,
              company: current.company,
              email: current.email,
            },
            status: current.checklistStatus,
            revision: current.version,
            answers: read ? {} : answers,
            notes: "Catatan uji",
            updated_at: date,
          },
          original: {},
          definition,
        });
      if (path.endsWith("/pdf") || path.startsWith("/api/konsultan/materials/"))
        return route.fulfill({
          headers: { ...headers, "Content-Type": "application/pdf" },
          body: path.startsWith("/api/konsultan/materials/")
            ? material
            : "%PDF-1.4\n%%EOF",
        });
      return reply({
        record: current,
        workspace: {
          version: current.version,
          checklist_revision: checklistRevision,
          source_id: null,
        },
        tasks: read ? [] : tasks,
        proposals: read ? [] : proposals,
        messages: read ? [] : messages,
        sources: [],
        activities: [],
        activityTotal: 0,
        bookings: read ? [] : bookings,
      });
    });

    await page.goto(`${origin}/konsultan`, { waitUntil: "domcontentloaded" });
    try {
      await page.getByText("Memverifikasi akses Anda…", { exact: true }).waitFor();
      await page.getByRole("heading", { name: "Beranda konsultan" }).waitFor({ timeout: 18_000 });
    } catch (error) {
      console.error("Portal fixture", { sessionChecks, defaultReads, personalReads, pageErrors, requests });
      console.error("Portal text", (await page.locator("body").innerText()).slice(0, 1500));
      throw error;
    }
    const mine = page.getByRole("link", { name: "PT Uji Konsultasi", exact: true });
    const peer = page.getByRole("link", { name: "PT Agenda Tim", exact: true });
    await page.getByRole("region", { name: "Prioritas saya" }).getByRole("link", { name: "Lanjutkan peluang" }).waitFor();
    await page.getByRole("region", { name: "Ringkasan tim" }).getByRole("link", { name: "Lihat semua peluang" }).waitFor();
    await expect.poll(() => requests.some(([method, path]) => method === "GET" && path === `/api/konsultan/${lead}`)).toBe(true);
    const portalNav = page.getByRole("navigation", { name: "Portal konsultan" });
    await portalNav.getByRole("link", { name: "Klien & peluang" }).click();
    await page.getByRole("heading", { name: "Klien & peluang" }).waitFor();
    await mine.waitFor();
    assert.equal(await peer.count(), 0);
    await portalNav.getByRole("link", { name: "Beranda", exact: true }).click();
    await page.getByRole("heading", { name: "Beranda konsultan" }).waitFor();
    await page.getByRole("link", { name: "Lanjutkan peluang" }).waitFor();
    assert.equal(sessionChecks, 0, "The initial authorized personal list verifies the shell without a second API call");
    assert.equal(defaultReads, 1, "Do not reload the team summary during navigation");
    assert.equal(personalReads, 1, "Home and Clients must share the personal list within the session");
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.screenshot({ path: `tmp/consultant-dashboard-${width}.png` });
    checks++;
    await page.getByRole("link", { name: "Lihat semua peluang" }).click();
    await peer.waitFor();
    await page.getByLabel("Penanggung jawab").selectOption(bob);
    await page.getByRole("searchbox", { name: "Cari klien" }).fill("Agenda Tim");
    await Promise.all([
      page.waitForRequest(request => new URL(request.url()).searchParams.get("search") === "Agenda Tim"),
      page.getByRole("button", { name: "Cari", exact: true }).click(),
    ]);
    await peer.click();
    await page.getByRole("heading", { name: "PT Agenda Tim" }).waitFor();
    await page.getByText("Diagnosis Tim / Organisasi", { exact: true }).waitFor();
    await page.getByRole("heading", { name: "Peluang tim · Hanya baca" }).waitFor();
    assert.equal(await page.getByRole("navigation", { name: "Detail peluang" }).locator("button[aria-describedby]").count(), 0);
    await page.getByRole("button", { name: "Kebutuhan & meeting" }).click();
    await page.getByText("Catatan uji", { exact: true }).waitFor();
    assert.equal(
      await page.getByRole("button", { name: "Simpan sesi" }).count(),
      0,
    );
    await page.getByRole("button", { name: "Proposal", exact: true }).click();
    assert.equal(
      await page.getByRole("button", { name: "Buat draf proposal" }).count(),
      0,
    );
    await page
      .getByRole("button", { name: "Tindak lanjut", exact: true })
      .click();
    assert.equal(
      await page.getByRole("button", { name: "Tambah tugas" }).count(),
      0,
    );
    assert.equal(writes.length, 0);
    checks++;

    await page.locator(`a[href="/konsultan/clients?owner=${bob}"]`).click();
    await peer.waitFor();
    assert.equal(await page.getByLabel("Penanggung jawab").inputValue(), bob);
    assert.equal(await page.getByRole("searchbox", { name: "Cari klien" }).inputValue(), "Agenda Tim");
    assert(!page.url().includes("Agenda"), "Keep search text out of the browser URL");
    await page.getByRole("button", { name: "Hapus pencarian" }).click();
    await page.getByRole("button", { name: "Tanggung jawab saya" }).click();
    await mine.waitFor();
    assert.equal(await peer.count(), 0);
    checks++;
    await mine.click();
    const detailNav = page.getByRole("navigation", { name: "Detail peluang" });
    await detailNav.waitFor();
    assert.equal(await detailNav.getByRole("button").count(), 4);
    const initialDetailReads = requests.filter(([method, path]) => method === "GET" && path === `/api/konsultan/${lead}`).length;
    assert.equal(initialDetailReads, 1, "The warmed priority detail must serve the first visit with one API read");
    if (width === 1440) {
      await page.getByRole("heading", { name: "Peluang baru" }).waitFor();
      await page.getByRole("button", { name: "Tinjau kontak klien" }).click();
      await page.locator("#work-contact").getByRole("button", { name: "Siapkan email" }).waitFor();
      local.stage = "consultation";
      await page.getByRole("button", { name: "Perbarui", exact: true }).click();
      checks++;
    }
    await page.getByRole("heading", { name: "Checklist belum selesai" }).waitFor();
    const proposalTab = detailNav.getByRole("button", { name: "Proposal", exact: true });
    await expect(detailNav.getByRole("button", { name: "Kebutuhan & meeting" })).toHaveAccessibleDescription("Checklist belum selesai");
    await expect(detailNav.getByRole("button", { name: "Ringkasan" })).toHaveAccessibleDescription("Jadwal menunggu konfirmasi");
    if (width === 320) {
      await page.getByRole("combobox", { name: "Bahasa tampilan" }).selectOption("en");
      await expect(page.getByRole("button", { name: "Needs and meeting" })).toHaveAccessibleDescription("Checklist incomplete");
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: "tmp/consultant-tab-attention-en-320.png" });
      await page.getByRole("combobox", { name: "Display language" }).selectOption("id");
    }
    await page.screenshot({ path: `tmp/consultant-next-step-${width}.png` });
    await page.getByRole("button", { name: "Proposal", exact: true }).click();
    await page.getByText("Selesaikan checklist kebutuhan terlebih dahulu.").waitFor();
    assert.equal(await page.getByRole("button", { name: "Buat draf proposal" }).count(), 0);
    await page.getByRole("button", { name: "Buka checklist kebutuhan" }).click();
    await page.getByRole("button", { name: "Tandai selesai" }).first().click();
    await page.getByRole("alert").getByText("Lengkapi jawaban yang wajib sebelum menandai sesi selesai.").waitFor();
    const question = page.getByRole("textbox", { name: "Tantangan utama" });
    await question.waitFor();
    assert(await question.evaluate(element => element === document.activeElement));
    assert.equal(writes.length, 0);
    await question.fill("Koordinasi antartim perlu lebih konsisten.");
    await page.getByRole("button", { name: "Tandai selesai" }).first().click();
    await page.locator("#work-checklist").getByRole("button", { name: "Susun proposal" }).click();
    checks++;
    await page.getByRole("checkbox", { name: /Program Kepemimpinan/ }).check();
    await page.getByLabel("Durasi (hari)").fill("2");
    await page.getByLabel("Jumlah peserta").fill("20");
    await page.locator('select[name="venue"]').selectOption("indoor");
    await page.getByLabel("Lokasi").fill("Jakarta");
    await page.getByRole("button", { name: "Buat draf proposal" }).click();
    await page
      .getByText("Draf proposal tersimpan. Tinjau PDF sebelum mengirim.")
      .waitFor();
    const proposalReview = page.locator(`details#proposal-${proposal}`);
    await proposalReview.getByText(/Revisi 1 · Draf siap ditinjau/).waitFor();
    await proposalReview.getByRole("button", { name: "Siapkan pengiriman proposal" }).waitFor();
    await expect(proposalTab).toHaveAccessibleDescription("Draf siap ditinjau");
    assert.equal(await proposalReview.evaluate(element => element.open), true);
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Unduh PDF" }).click();
    assert.equal(
      (await download).suggestedFilename(),
      "BinaHub-Proposal-r1.pdf",
    );
    checks++;
    await proposalReview.getByRole("button", { name: "Siapkan pengiriman proposal" }).click();
    const email = page.locator("#work-email");
    await email.getByRole("heading", { name: "Siapkan email" }).waitFor();
    assert.equal(await email.getByLabel("Jenis email").inputValue(), "proposal");
    assert.equal(await email.getByLabel("Lampiran proposal").inputValue(), proposal);
    await page.getByLabel("Tugas baru").fill("Konfirmasi jadwal klien");
    await page.getByLabel("Tenggat").fill("2099-01-03T09:00");
    await page.getByRole("button", { name: "Tambah tugas" }).click();
    await page
      .getByRole("heading", { name: "Konfirmasi jadwal klien" })
      .waitFor();
    await page.getByRole("button", { name: "Tandai selesai" }).click();
    await page.getByText("Tugas ditandai selesai.").waitFor();
    checks++;
    await page.getByLabel("Subjek").fill("Proposal konsultasi");
    await page.getByLabel("Isi pesan").fill("Ini pesan pengujian browser.");
    await page.getByRole("button", { name: "Tinjau pengiriman" }).click();
    await page
      .getByRole("dialog")
      .getByText(/client@example.invalid/)
      .waitFor();
    await page.getByRole("button", { name: "Antrekan email" }).click();
    await page.locator("#work-delivery").getByText("Email masuk antrean. Pantau statusnya di riwayat pengiriman.").waitFor();
    assert.equal(writes.find(write => write.kind === "proposal").proposalId, proposal);
    await page.getByText("Proposal konsultasi · Menunggu jadwal").click();
    assert.equal(await proposalTab.getAttribute("aria-describedby"), null);
    await page.getByRole("button", { name: "Batalkan pengiriman" }).click();
    await page.getByText("Proposal konsultasi · Dibatalkan").waitFor();
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    checks++;

    checklistRevision++;
    local.version++;
    await page.getByRole("button", { name: "Perbarui", exact: true }).click();
    const nextStep = page.getByRole("region", { name: "Langkah berikutnya" });
    await nextStep.getByRole("heading", { name: "Proposal perlu revisi" }).waitFor();
    await expect(proposalTab).toHaveAccessibleDescription("Proposal perlu revisi");
    await page.getByRole("button", { name: "Siapkan email", exact: true }).click();
    assert(await email.getByLabel("Lampiran proposal").isDisabled());
    await nextStep.getByRole("button", { name: "Buat revisi" }).click();
    await page.getByText(/Revisi 1 · Draf · Perlu revisi/).waitFor();
    assert.equal(await proposalReview.getByRole("button", { name: "Siapkan pengiriman proposal" }).count(), 0);
    checks++;

    messages[0].status = "failed";
    await page.getByRole("button", { name: "Perbarui", exact: true }).click();
    const failedBadge = detailNav.getByRole("button", { name: "Tindak lanjut" });
    await expect(failedBadge).toHaveAccessibleDescription("Gagal diproses");
    await failedBadge.locator('[data-urgent="true"]').waitFor();
    if (width === 390) await page.screenshot({ path: "tmp/consultant-tab-attention-id-390.png" });
    await failedBadge.click();
    await page.waitForURL(/focus=delivery/);
    checks++;

    proposals[0].status = "sent";
    proposals[0].checklist_revision = checklistRevision;
    messages[0].status = "accepted";
    await page.getByRole("button", { name: "Perbarui", exact: true }).click();
    await nextStep.getByRole("heading", { name: "Proposal sudah dikirim" }).waitFor();
    await nextStep.getByRole("button", { name: "Klien sudah setuju?" }).click();
    await page.getByLabel("Kesepakatan klien dan arahan pelaksanaan").fill("Klien menyepakati pelaksanaan di Jakarta.");
    await page.getByRole("button", { name: "Tinjau serah terima" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Serahkan ke admin" }).click();
    await nextStep.getByRole("heading", { name: "Serah terima tercatat" }).waitFor();
    assert.equal(await detailNav.locator("button[aria-describedby]").count(), 0);
    checks++;

    await portalNav.getByRole("link", { name: "Tugas & jadwal" }).click();
    await page.getByRole("button", { name: "Jadwal", exact: true }).click();
    await page.getByText("Menunggu konfirmasi", { exact: true }).waitFor();
    await page.getByRole("link", { name: "Konfirmasi waktu konsultasi" }).click();
    const schedule = page.locator("#work-schedule");
    await schedule.getByText("Tunggu konfirmasi jadwal sebelum membuka meeting.").waitFor();
    await schedule.getByText("Waktu pertemuan sudah lewat.").waitFor();
    assert.equal(await schedule.getByRole("link", { name: "Buka meeting" }).count(), 0);
    checks++;

    await page.goto(`${origin}/konsultan/materials`);
    await page.getByRole("heading", { name: "Materi konsultan" }).waitFor();
    const documents = page.getByRole("region", { name: "Dokumen" });
    assert.equal(await documents.getByRole("article").count(), 2);
    if (width <= 390) {
      for (const card of await documents.getByRole("article").all()) {
        const title = await card.getByRole("heading").boundingBox();
        const read = await card.getByRole("link").boundingBox();
        const downloadButton = await card.getByRole("button").boundingBox();
        assert(title.y < read.y && read.y === downloadButton.y, "Document actions must sit below the title");
        assert(read.x >= 0 && downloadButton.x + downloadButton.width <= width, "Both actions must fit inside the viewport");
      }
      assert(await page.getByRole("link", { name: "Kembali ke AMS" }).filter({ visible: true }).isVisible());
    }
    await page.getByRole("combobox", { name: "Bahasa tampilan" }).selectOption("en");
    await page.getByRole("heading", { name: "Consultant materials" }).waitFor();
    await page.getByRole("link", { name: "Read Company Profile BinaHub online" }).waitFor();
    await page.reload();
    await page.getByRole("heading", { name: "Consultant materials" }).waitFor();
    assert.equal(await page.getByRole("combobox", { name: "Display language" }).inputValue(), "en");
    await page.getByRole("combobox", { name: "Display language" }).selectOption("id");
    await page.getByRole("heading", { name: "Materi konsultan" }).waitFor();
    await page.screenshot({ path: `tmp/consultant-materials-grid-${width}.png` });
    assert.deepEqual(
      await page.getByRole("link", { name: /^Baca .* di web$/ }).evaluateAll(
        links => links.map(link => link.getAttribute("href")),
      ),
      ["/konsultan/materials/company-profile", "/konsultan/materials/product-knowledge"],
    );
    let readerDownloads = 0;
    page.on("download", () => { readerDownloads++; });
    await page.getByRole("link", { name: "Baca Product Knowledge BinaHub di web" }).click();
    await page.getByText("Halaman 1 dari 2").waitFor();
    await page.getByText("Contoh halaman pertama — Versi 3", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Halaman berikutnya" }).click();
    await page.getByText("Halaman 2 dari 2").waitFor();
    await page.getByText("Contoh halaman kedua — Versi 3", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Perbesar" }).click();
    await page.getByRole("button", { name: "Pas layar" }).waitFor();
    await page.getByText("Contoh halaman kedua — Versi 3", { exact: true }).waitFor();
    assert.equal(readerDownloads, 0);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `tmp/consultant-material-${width}.png` });
    const pdfDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "Unduh PDF", exact: true }).click();
    assert.equal((await pdfDownload).suggestedFilename(), "BinaHub-product-knowledge-v3.pdf");
    await page.getByRole("link", { name: "Semua materi" }).click();
    await page.getByRole("link", { name: "Baca Company Profile BinaHub di web" }).click();
    await page.getByText("Contoh halaman pertama — Versi 3", { exact: true }).waitFor();
    checks++;

    if (width === 1440) {
      asAdmin = true;
      availabilityFailure = true;
      await page.goto(`${origin}/konsultan/clients/${lead}`);
      await page.getByRole("heading", { name: "Penugasan konsultan" }).waitFor();
      const select = page.locator('select[name="userId"]');
      await page.getByRole("alert").getByText("Daftar akun AMS belum dapat diperiksa.").waitFor();
      assert(await select.isDisabled());
      availabilityFailure = false;
      await page.getByRole("button", { name: "Coba lagi", exact: true }).click();
      await select.getByRole("option", { name: members[0].name }).waitFor({ state: "attached" });
      assert.equal(await select.getByRole("option", { name: members[1].name }).count(), 0);
      assert(await select.isEnabled());
      asAdmin = false;
      checks++;
    }

    const adminResponse = await context.request.get(`${origin}/admin/consultants`, { maxRedirects: 0 });
    assert.equal(adminResponse.status(), 303);
    assert.equal(new URL(adminResponse.headers().location, origin).pathname, "/access-denied");
    assert.deepEqual(pageErrors, []);
    checks++;
    await context.close();
  }
  console.log(
    `[PASS] ${checks} portal UI checks at 1440/1024/390/320px; synthetic auth, API, PDF and email`,
  );
} finally {
  await browser.close();
  testServer.close();
}
