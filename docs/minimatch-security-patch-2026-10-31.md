# Minimatch dependency patch — 31 October 2026

Scope: CVE-2026-118764 / GHSA-g3hv-75wg-m249 reported by Hostinger.
The affected dependencies are in the ESLint development toolchain, not a new
public endpoint. This is dependency remediation, not a penetration test or a
claim that a deployed site is free from other vulnerabilities.

## Implementation

- Lock the official registry package `minimatch@11.0.1` for every consumer. Keep
  the established ESLint9 and Next configuration; do not downgrade tools via
  `npm audit fix --force`, remove lint checks or suppress the advisory.
- Legacy React/import/accessibility plugins expect `require('minimatch')` to be
  callable. The current matcher exports a named API, and v11 also removed the
  old regex compiler. An ordinary major-version override alone is insufficient.
- `tools/minimatch-compat.mjs` runs before plugin imports, only in the lint
  process. It bridges that process's CommonJS module cache to a callable facade
  over the official v11 matcher. No dependency file is patched, package renamed,
  old matching algorithm vendored, lifecycle hook installed, global environment
  variable set, or production application module changed.
- The `import/no-internal-modules` consumer of `makeRe` only calls `.test()`.
  The adapter returns a matcher-backed predicate, not a compiled regex. This is
  deliberately not a general RegExp polyfill. Recheck this adapter before
  upgrading plugins; remove it once all consumers support the modern API.
- The dependency contract checks registry versions and actual legacy API/rule
  execution. It must fail if old versions, local package links or disabled
  behavior accidentally return. CI includes development advisories.

## Verification commands

```text
npm ci --ignore-scripts
npm ls minimatch --all
npm audit --audit-level=moderate
npm audit --omit=dev
npm run test:dependencies
```

Run the repository's normal lint, type checks, tests and production build too.
Clean-install warnings caused by Windows file locks are not security findings;
an invalid dependency tree or failed compatibility test must block the release.
No SQL or environment variable is required. Hostinger must deploy the new
lockfile/build and rescan before its production alert can be considered cleared.

Source: [maintainer advisory](https://github.com/isaacs/minimatch/security/advisories/GHSA-g3hv-75wg-m249).

## Local verification completed

- Clean install from the final lockfile, without lifecycle scripts, succeeded.
  Every installed matcher resolved to official registry version11.0.1.
- Full npm audit and runtime-only npm audit both reported0 advisories.
- Three dependency contract tests passed, including allowed and rejected lint
  fixtures. The normal lint command remained enabled and passed.
- Production build and its TypeScript phase passed. App regression:394 tests;
  website program handoff and its two deployment-contract tests also passed.
- These are local results, not proof of Hostinger deployment or rescan. No
  production request, secret rotation, schema change or participant-data mutation.
