# PETA shared administration and participant revisions

Prepared 31 October 2026: app0.50.3 / API0.46.4 / SQL79.

## Scope and behavior

- All verified BinaHub admins share PETA program configuration, progress,
  retained history and management. Workspace creator is provenance, not scope.
- Submitted, unexpired results are available to every admin only when the
  participant allowed review and a reviewer was configured at participation.
  Declined consent, participant identity checks and the one-year retention remain.
  API identity comes from requireAdmin, not a body/query actor or owner field.
- New service-role-only team RPCs leave browser table/function grants unchanged.
  Audit stores the real acting admin; no creator impersonation or reassignment.
- Situation14 displays “antar tim”. This is an approved public-DTO correction,
  not a rewrite of the encrypted source, fingerprints, option IDs or scoring key.
- Participant questions show their context inside the question card before the
  statements. Review shows each context plus the two selected full statements.
- Report uses the CEO's preference-not-competence disclaimer and one deterministic
  reflective paragraph. Ties/close scores remain qualified; no AI/provider call,
  diagnosis, ability claim, ranking or permanent personality type is added.
- Report header shows completion date, not technical version/generated ID.
  Stored audit metadata, both charts and all report numbers remain unchanged.

## Activation

Apply only API migration `0079_peta_admin_team_access.sql` to the existing SQL78
database. Then push/deploy API0.46.4 before app0.50.3. No new env, source reinstall,
participant backfill or cleanup is required. Production SQL/deployment have not
been performed during local implementation; wait for the owner's confirmation.

## Verification

The native-bundler-independent harnesses use only synthetic data:

- API `node scripts/test-peta-team.mjs`: 12 checks passed against real migration
  functions in in-memory PGlite and the actual HTTP guard/routes with mock auth/
  source adapters. Covers four participants seen by two admins, re-runnable SQL,
  unchanged snapshots/scoring, actual audit actor, retained history, declined/
  expired/revoked results, browser-role denial, caller-ownership rejection,
  filtered private flags, legacy invitation management and display-only typo fix.
- App `node scripts/test-peta-revision-ui.mjs`: five React/JSDOM checks passed.
  Covers the CEO notice/narrative, no technical header, exact charts/numbers,
  unique/tied/close patterns, question context, selected-text review/editing,
  unchecked optional permission and shared-admin settings/result gates.
- API and app TypeScript: passed in the same offline sandbox. The initial API
  check exceeded the explicit 768MiB heap; rerun at 2GiB heap passed. Missing
  manifest/config mounts were completed before the successful checks.
- Scoped UI mechanical detector: no findings. Layout identity is unchanged;
  this is not a new desktop/mobile browser-layout verification.
- Scoped ESLint passed for the changed API and app PETA TypeScript files.

Execution boundary: existing local n8n image (Node22), no image/package download,
`--network none`, read-only root/source/dependencies, no-new-privileges, dropped
capabilities, non-root UID1000, scratch-only HOME/TMP, explicit CPU/RAM/PID/file/
scratch/time limits. No project env file, private CEO key/source, provider token,
production account, email or remote API was mounted or invoked.

The native Vitest/Playwright suites and production build were not run in this
Linux sandbox because installed bundler bindings are Windows-specific. Regression
cases were also added to the existing Vitest files; the old Playwright launcher
is preserved and its question-heading selector is updated. No full Strix pentest,
production smoke, psychometric validation or production-readiness claim is made.
