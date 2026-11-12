import assert from "node:assert/strict";
import { createServer } from "node:http";
import { chromium } from "@playwright/test";
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
  ...["Contoh halaman pertama", "Contoh halaman kedua"].map((label) =>
    createElement(Page, { key: label, size: "A4", style: { padding: 40 } },
      createElement(Text, null, label),
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
  ],
  screens: [["Q01"]],
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
  checklistStatus: "completed",
  canEdit: true,
  handoff: null,
};
const readOnly = {
  ...record,
  id: peerLead,
  company: "PT Agenda Tim",
  assigneeId: bob,
  assigneeName: members[1].name,
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
const browser = await chromium.launch({ headless: true });
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
    const pageErrors = [],
      writes = [];
    const local = { ...record },
      proposals = [],
      messages = [],
      tasks = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
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
      if (path === "/api/konsultan/session")
        return reply({
          id: alice,
          role: asAdmin ? "admin" : "consultant",
          name: members[0].name,
          isAdmin: asAdmin,
        });
      if (path === "/api/konsultan") {
        const owner = url.searchParams.get("owner");
        const records =
          owner === "mine"
            ? [local]
            : owner === bob
              ? [readOnly]
              : [local, readOnly];
        return reply({
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
          bookings: [],
        });
      }
      if (path === "/api/konsultan/agenda")
        return reply({ records: tasks, total: tasks.length, pageSize: 20 });
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
            checklist_revision: 1,
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
            status: "completed",
            revision: current.version,
            answers: {},
            notes: "Catatan uji",
            updated_at: date,
          },
          original: {},
          definition,
        });
      if (path.endsWith("/pdf") || path.startsWith("/api/konsultan/materials/"))
        return route.fulfill({
          headers: { ...headers, "Content-Type": "application/pdf" },
          body: path.startsWith("/api/konsultan/materials/") ? material : "%PDF-1.4\n%%EOF",
        });
      return reply({
        record: current,
        workspace: {
          version: current.version,
          checklist_revision: 1,
          source_id: null,
        },
        tasks: read ? [] : tasks,
        proposals: read ? [] : proposals,
        messages: read ? [] : messages,
        sources: [],
        activities: [],
        activityTotal: 0,
        bookings: [],
      });
    });

    await page.goto(`${origin}/konsultan`);
    await page.getByRole("heading", { name: "Beranda konsultan" }).waitFor();
    await page
      .getByRole("link", { name: "PT Uji Konsultasi", exact: true })
      .waitFor();
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.screenshot({ path: `tmp/consultant-dashboard-${width}.png` });
    checks++;
    await page
      .getByRole("link", { name: "PT Agenda Tim", exact: true })
      .click();
    await page.getByRole("heading", { name: "PT Agenda Tim" }).waitFor();
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

    await page
      .getByRole("navigation", { name: "Portal konsultan" })
      .getByRole("link", { name: "Klien & peluang" })
      .click();
    await page.getByLabel("Penanggung jawab").selectOption("mine");
    await page
      .getByRole("link", { name: "PT Uji Konsultasi", exact: true })
      .waitFor();
    assert.equal(
      await page
        .getByRole("link", { name: "PT Agenda Tim", exact: true })
        .count(),
      0,
    );
    checks++;
    await page
      .getByRole("link", { name: "PT Uji Konsultasi", exact: true })
      .click();
    await page.getByRole("button", { name: "Proposal", exact: true }).click();
    await page.getByRole("checkbox", { name: /Program Kepemimpinan/ }).check();
    await page.getByLabel("Durasi (hari)").fill("2");
    await page.getByLabel("Jumlah peserta").fill("20");
    await page.locator('select[name="venue"]').selectOption("indoor");
    await page.getByLabel("Lokasi").fill("Jakarta");
    await page.getByRole("button", { name: "Buat draf proposal" }).click();
    await page
      .getByText("Draf proposal tersimpan. Tinjau PDF sebelum mengirim.")
      .waitFor();
    await page.getByText(/Revisi 1 · Draf/).click();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Unduh PDF" }).click();
    assert.equal(
      (await download).suggestedFilename(),
      "BinaHub-Proposal-r1.pdf",
    );
    checks++;
    await page
      .getByRole("button", { name: "Tindak lanjut", exact: true })
      .click();
    await page.getByLabel("Tugas baru").fill("Konfirmasi jadwal klien");
    await page.getByLabel("Tenggat").fill("2099-01-03T09:00");
    await page.getByRole("button", { name: "Tambah tugas" }).click();
    await page
      .getByRole("heading", { name: "Konfirmasi jadwal klien" })
      .waitFor();
    await page.getByRole("button", { name: "Tandai selesai" }).click();
    await page.getByText("Tugas ditandai selesai.").waitFor();
    checks++;
    await page.getByLabel("Jenis email").selectOption("proposal");
    await page.getByLabel("Lampiran proposal").selectOption(proposal);
    await page.getByLabel("Subjek").fill("Proposal konsultasi");
    await page.getByLabel("Isi pesan").fill("Ini pesan pengujian browser.");
    await page.getByRole("button", { name: "Tinjau pengiriman" }).click();
    await page
      .getByRole("dialog")
      .getByText(/client@example.invalid/)
      .waitFor();
    await page.getByRole("button", { name: "Antrekan email" }).click();
    await page.getByText("Proposal konsultasi · Menunggu jadwal").click();
    await page.getByRole("button", { name: "Batalkan pengiriman" }).click();
    await page.getByText("Proposal konsultasi · Dibatalkan").waitFor();
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    checks++;

    await page.goto(`${origin}/konsultan/materials`);
    let readerDownloads = 0;
    page.on("download", () => { readerDownloads++; });
    await page.getByRole("link", { name: "Baca Product Knowledge BinaHub di web" }).click();
    await page.getByText("Halaman 1 dari 2").waitFor();
    await page.getByText("Contoh halaman pertama", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Halaman berikutnya" }).click();
    await page.getByText("Halaman 2 dari 2").waitFor();
    await page.getByText("Contoh halaman kedua", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Perbesar" }).click();
    await page.getByRole("button", { name: "Pas layar" }).waitFor();
    await page.getByText("Contoh halaman kedua", { exact: true }).waitFor();
    assert.equal(readerDownloads, 0);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `tmp/consultant-material-${width}.png` });
    const pdfDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "Unduh PDF", exact: true }).click();
    assert.equal((await pdfDownload).suggestedFilename(), "BinaHub-product-knowledge.pdf");
    await page.getByRole("link", { name: "Semua materi" }).click();
    await page.getByRole("link", { name: "Baca Company Profile BinaHub di web" }).click();
    await page.getByText("Contoh halaman pertama", { exact: true }).waitFor();
    checks++;

    if (width === 1440) {
      asAdmin = true;
      availabilityFailure = true;
      await page.goto(`${origin}/konsultan/clients/${lead}`);
      await page.getByRole("heading", { name: "Penugasan konsultan" }).waitFor();
      const select = page.getByLabel("Penanggung jawab", { exact: true });
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

    await page.goto(`${origin}/admin/consultants`);
    await page.waitForURL(`${origin}/access-denied`);
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
