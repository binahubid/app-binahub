# Unslop — app and AMS shared UI

4 November 2026 · app0.51.12 · AMS0.11.5/web0.10.5

Method: Unslop by Damir Sokolovsky, https://github.com/heydamir/unslop,
CC BY 4.0. Installed source reviewed at
`a6f121eee5f29c2f74976b75456feae8b66afb3a`. No third-party snapshot/story
scripts, image generation, new dependencies or provider quota used.

## Direction agreed by the owner

- Product: BinaHub's operational workspace and associate management portal.
- Character: calm, clear, purposeful.
- World: the existing navy/gold consulting brand and real program work.
- Moments: actual program records and meaningful status/metrics, not chrome.
- Signature: consistent navy actions, readable labels and aligned figures.

Polish, not a replacement design. Preserve menus, artwork, page order, brand
font, approved glass/gradients and actual commercial/instrument copy.

## Verified findings and changes

- App sidebar groups, page context and breadcrumb were 10px widely tracked
  uppercase. Use 12px sentence-case labels, keep the same routes and groups.
- Sidebar search inherited the generic white form surface. Give it an explicit
  navy surface/light ink and readable placeholder, distinct from content fields.
- Metric values were vertically misaligned when one card had an icon. Place
  the optional icon beside the label/value block; use consistent numeric baselines.
- Shared admin fields were 12px mobile/14px desktop and 40px high. Use 16px
  mobile/14px desktop and 44px controls. Shared labels/help become more legible.
- Table headings become 12px normal-case metadata, without wide tracking.
- Diagnosis/PE helper/footnote text at 10–11px becomes 12px; no question text,
  hidden action keys, scoring, consent or retention changes.
- AMS navigation labels were tiny/low-opacity; improve the actual text roles.
  Keep its existing admin navy sidebar and associate white sidebar.
- AMS stats had gradient icons and hover translation; use quiet neutral icons
  and stationary surfaces. Keep the same values and status meanings.
- Gold button uses navy text; review status keeps its static dot and label,
  without perpetual ping. Search gets an accessible name; filter buttons keep
  their behavior and expose pressed state, with explicit button type.
- Add skip destinations, named 44px controls, mobile drawer Escape/focus loop
  and return focus. The notification popup now anchors within mobile viewport.
- Table styling is screen-only in AMS; CV/print layout and export access unchanged.

Pass order: spacing/targets and metric baselines; existing palette/contrast;
quiet existing icons; concise existing labels; readable type; local responsive
containment; focus/semantics; preserve visuals; remove decorative movement only.

## Scope and limitations

AdminShell reaches the existing app admin routes; shared controls/styles affect
their consumers. AMS admin/reviewer and associate layouts and shared components
are covered. This does not mean every inner section of every route was rebuilt
or audited individually. Specialized live-score, participant/client/facilitator
screens, PDF layouts and public AMS marketing/auth pages were not redesigned.
An exhaustive accessibility/performance audit remains a separate task.

Codebase Memory: app graph 2026-11-04T03:17:52Z, AdminShell inbound/outbound
trace and exact-path coverage; AMS graph limited to apps/web, generation
2026-11-04T03:41:41Z. Ignored secrets, public assets and generated outputs;
no sibling/private data indexed. Framework wrapper callers absent from the
graph were resolved using source reads, not interpreted as unused code.

## Local verification

- 30 workspace cases: app program/PETA/sales nav contexts and AMS admin,
  reviewer/associate at 1440/1024/768/390/320px. Actual shells/components,
  synthetic content; API reads mocked, external requests/writes blocked.
  Search/filter, control names, table typography, drawer Escape/return focus,
  status/tab and mobile notification bounds tested. Not live role/data testing.
- 20 public cases: /diagnose, /discovery, /insight/individual and packages at
  the same five widths, using a production app build and synthetic definitions.
  No submission. Synthetic zero-item PE text is not a claim about real item count.
- Initial AMS preview omitted some Tailwind classes because relative content
  globs used the wrong working directory. Fix the preview config and repeat
  baseline; do not report that screenshot artifact as a production layout bug.
- A first after-pass found actual notification popup overflow on mobile. Anchor
  it to viewport margins and repeat functional checks; all 30 then passed.
- Visual evidence in ignored tmp/unslop-workspaces-before/after and
  tmp/unslop-public. Keep original UI screenshots for future comparisons.
- App regression: 564 existing tests passed; four additional AdminShell tests
  passed, as did repeated shared dialog tests. App lint/type/build passed.
- AMS: 14 local API/status/PDF/dependency contracts passed; frontend lint/types
  and build passed. Final build/check confirmation is recorded in readiness log.

No real login, email, AI, program enrollment, database mutation or scheduler
activation. No new SQL/env. No Strix scan or production deployment claim.
