---
# folio-assistant-rsi6
title: 'PUBLISHED PACKAGE, UNBUILT: block-qa-schema ships to npm and no gate built it — #914 merged green and broken'
status: completed
type: task
priority: normal
created_at: 2026-09-26T03:24:48Z
updated_at: 2026-09-26T04:01:27Z
parent: folio-assistant-1xhc
---

Measured 2026-09-26, by building the package rather than by reading about it.

`@litlfred/block-qa-schema` is the **only** package in this repository that
ships to npm. It is named in no `.github/workflows/*.yml`, and the root
`package.json` declares no `workspaces`, so its devDependencies had never been
installed on a runner and its `build` and `test` scripts had never run. Its
`node_modules/` did not exist in a fresh checkout.

## The cost, paid rather than predicted

[PR #914](https://github.com/litlfred/folio-assistant/pull/914) bumped its
`typescript` from 5.9.3 to **7.0.2** and passed **ten** CI checks — not one of
which read the file it changed. It merged. The package was then unbuildable:

    TypeError: Cannot read properties of undefined
      (reading 'useCaseSensitiveFileNames')

**With the control, because a single failure names no cause:**

| `typescript` | `bun run build` |
|---|---|
| 5.9.3 (pre-bump) | **success** — ESM, CJS and DTS |
| 6.x | fails — `error occurred in dts build` |
| 7.0.2 (merged) | fails — the `TypeError` above |

And the fourth measurement, which is the one that decides the fix: **TypeScript
7's own `tsc` emits these declarations without complaint.** So the bump is not
the defect. `tsup --dts` is: it delegates to `rollup-plugin-dts`, which bundles
its own TypeScript 5.7.3 and reaches into compiler internals TypeScript 7
changed.

## Fixed here

- The package **owns its compiler settings** — a `tsconfig.json` of its own.
  It had none, so `tsc` walked up and found the PLATFORM's, a config written
  for a Bun application (`types: [bun-types]`, `allowImportingTsExtensions`)
  and never for something that ships `.d.ts` to npm. Inheriting by
  directory-walk accident is not configuration.
- `build` emits declarations with `tsc -p tsconfig.json` instead of
  `tsup --dts`. The owner's TypeScript 7 decision stands; the toolchain moved.
- `check:published-packages` builds every publishable package git accounts
  for, wired into `code-quality-gates.yml`. The set is DERIVED, and an **empty
  set fails** — a sweep that examined nothing has cleared nothing.

Verified end to end, not by exit code alone: CJS and ESM each load with 12
exports, and a consumer type-checks clean against the emitted `.d.ts`. The gate
was verified by BREAKING it — restoring `--dts` fails it, exit 1, and the
restored script passes, exit 0.

## Done when

- [x] The package builds under the TypeScript that is actually pinned.
- [x] A gate builds it, so the next bump cannot land green and broken.
- [x] The gate refuses to call an empty discovery a pass.
- [x] **Four scanners that broke when the gate created `node_modules/`** are
      fixed and share one statement of the rule (`scripts/git-corpus.ts`).
      Recorded against `xd1g`, which is where that survey lives.
- [ ] **Its `test` script is a second, untouched defect.** `vitest run` reports
      *"No test files found, exiting with code 1"* — the only test in the
      package is `tests/test_python.py`, a Python test, and nothing runs that
      either. So the package has a `test` script that has never passed. Not
      fixed here: whether the JS half wants tests, or the script should run the
      Python one, is a decision about what this package promises, and this bean
      is about the build.
- [ ] Whether a published package should also be **version-checked** against
      the platform it ships beside — it pins `typescript ^7` while the root
      pins `^6` — is a question this raises and does not answer.
