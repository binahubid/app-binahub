# Assessment Admin local preview

`/unslop.html?route=/admin/programs` previews the actual admin shell/shared
controls with synthetic records. Also supports PETA/sales navigation contexts.
`node scripts/test-unslop-workspaces-ui.mjs after` checks it alongside the
sibling AMS UI fixture (see binahub-platform/scripts/ui-preview/README.md).
`node scripts/test-unslop-public-ui.mjs` checks four public entry routes against
an already-built app running at loopback4330; all API traffic is mocked.

Run `npx vite --config scripts/assessment-preview/vite.config.ts` and open `http://127.0.0.1:4318`.

Uses the real AssessmentPanel with synthetic fixtures and in-memory action callbacks. No production API proxy, credentials, real email, or database writes. Documents deliberately cannot be fetched because the mock session is unauthenticated. This is not a public Next.js route and is not included in the application build.

`?journey` previews the real pipeline drawer, client context and handoff with
synthetic records. Its mutation callback deliberately rejects all writes.
Run `npm run test:client-journey` for an automatically closed, random-loopback-port
preview and Chromium desktop/mobile checks. It does not bypass production auth
or call the production API.

## Discovery organisasi (SPIN)

`node scripts/test-spin-ui.mjs` menyalakan preview loopback sementara lalu
menjalankan tes desktop/ponsel dengan semua endpoint `/api/**` dimock.
Mencakup 21 kelompok layar, batas pilihan dan keyboard, konfirmasi ringkasan,
kontak/submit ganda, laporan dan workspace admin. Tidak memakai token admin,
model atau email nyata. Screenshot lokal berada di `.impeccable/review/`
(diabaikan Git). Preview manual: `?spin`, `?spin&view=report`, `?spin&view=admin`.
Jangan gunakan mode preview sebagai jalur kirim ke produksi.
