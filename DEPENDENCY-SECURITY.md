# Dependency security review — 2026-10-06

## Fixed in 0.28.1

`source-map-js` is overridden to 1.2.2 in package.json and package-lock.json.
This fixes CVE-2026-93749 / GHSA-68fv-2mgg-jv7q across all installed consumers.
Production dependency audit (`npm audit --omit=dev`) reports zero vulnerabilities.

## Remaining development-tooling advisory

`npm audit` reports five high-severity entries from one underlying advisory:
CVE-2026-93687 / GHSA-vfj7-8cjw-p6xm in `braces` through 3.0.3.
The chain is:

`eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`

The npm registry's latest braces version is 3.0.3 and the GitHub advisory lists
no patched version at the review date. These entries remain open; they are not
suppressed or presented as fixed.

The installed Next ESLint plugin uses fast-glob in `get-root-dirs` only when
`settings.next.rootDir` is a string or array. This repository does not set that
option: the plugin uses the working directory without glob expansion. This
reduces exposure for this specific call path, not a guarantee that the package
is safe in all contexts. It is a development dependency, not an application
request handler.

Operational precautions:

- Do not supply user-controlled or external glob patterns to lint configuration.
- Do not run untrusted repository configurations with production credentials.
- Keep the Next, React, TypeScript, and accessibility lint rules enabled.
- Recheck the advisory and registry before the next dependency update; apply a
  compatible upstream patch once one is released, then rerun lint, tests,
  typecheck, build, and both dependency audits.
- Do not use `npm audit fix --force`: the current suggested downgrade to
  eslint-config-next 14.2.35 is not a compatible patch for Next 16.

Sources:

- https://github.com/advisories/GHSA-vfj7-8cjw-p6xm
- https://github.com/advisories/GHSA-68fv-2mgg-jv7q

No environment changes or SQL migrations are required for 0.28.1.
