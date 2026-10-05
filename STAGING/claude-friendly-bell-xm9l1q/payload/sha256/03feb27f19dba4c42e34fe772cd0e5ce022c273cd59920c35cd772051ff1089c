---
# folio-assistant-vwd8
title: 'TYPESCRIPT 7: migrate from 6.0.3 (Dependabot #910)'
status: in-progress
type: task
created_at: 2026-09-30T08:59:32Z
updated_at: 2026-09-30T08:59:32Z
parent: folio-assistant-vuip
---

## What

The owner said **"Try migration now"** on 2026-09-30, which reopens the 2026-09-27
hold recorded in `folio-assistant-u2ol`. This bean works option 3 from that bean,
**side-by-side**, on branch `claude/magical-archimedes-4qkfxp-ts7`. TS 7 does the
typechecking. The TS 6 JS API stays installed for the code that imports it.
Measured 2026-09-30.

## Why #910 has been red since 2026-09-23. It is not TypeScript at all.

All three hard checks run `bun install --frozen-lockfile` and fail within 10 s.
Job logs 107060075437 and 107060065293 (bun 1.4.2) show:

    error: lockfile had changes, but lockfile is frozen

Dependabot bumps `package.json` but never rewrites `bun.lock` (see `197s`). So CI
has never reached a TS 7 compiler on #910.

## What TS 7 actually breaks, once installed as `typescript`

1. **The compiler API.** In `typescript@7.0.2` the main export is `lib/version.cjs`
   and exposes only `version` and `versionMajorMinor`. The API lives under
   `typescript/unstable/*`, as `u2ol` measured. `bun run typecheck` gives **128
   errors**, and all of them are in the importers of the API. There are **four**
   importers, not three: `scripts/schema-graph.ts` (73),
   `content/pipeline/qa-criterion-hash.ts` (38), `schemas/kind-validator.ts` (9),
   and **`scripts/check-test-budgets.ts` (8), which `u2ol` did not list**. The
   rest of the program typechecks clean under TS 7.
2. **typescript-eslint.** 8.70.0, and 8.71.0 which is the latest, declare peer
   `typescript >=4.8.4 <6.1.0`. On load they throw:
   `Error: typescript-eslint does not support TS 7.0.` The tracking issue is
   typescript-eslint#10940 (TS >= 7.1). `typescript-eslint/dist/index.js`
   calls `require("typescript")`, so **the package named `typescript` must be
   TS <= 6.0** for as long as typescript-eslint is in use. No config setting can
   change that.

## The arrangement on the branch

    "typescript":  "npm:@typescript/typescript6@6.0.2"   // Microsoft's TS6 re-export; depends on @typescript/old = npm:typescript@^6 → 6.0.3
    "typescript7": "npm:typescript@^7.0.2"
    "typecheck":   "bun node_modules/typescript7/bin/tsc --noEmit -p tsconfig.json"
    CI step "tsc --noEmit": same explicit command (was `bunx tsc …`)

No source file changed. The four API importers still get the real **TS 6.0.3**
API, the same version as on `main`. `qa-criterion-hash` therefore hashes exactly
as it did before. typescript-eslint gets TS 6 as well.

## Two traps this arrangement has to avoid, and each is a finding

- **`.bin/tsc` is TS 6.0.3, not TS 7.** On both bun 1.3.11 and 1.4.2, bun links
  the `tsc` bin of the transitive `@typescript/old` over `typescript7`'s `tsc`.
  `bunx tsc` therefore typechecks with **TS 6 and still reads green**, which is
  why the CI step now names the TS 7 launcher by path. Checked: an injected TS2322
  is reported by `bun run typecheck`.
- **bun 1.3.11 resolves the alias in a circle.** Resolving from scratch on 1.3.11
  gives `"@typescript/old": ["@typescript/typescript6@6.0.2", …]`: the wrapper
  depends on itself, and `require("typescript")` returns `{}`. That breaks
  `kind-validator` at run time. **bun 1.4.2**, which CI uses, resolves it
  correctly to `typescript@6.0.3`. bun 1.3.11 also installs correctly **from the
  committed lockfile** (`--frozen-lockfile`, verified). The risk is limited to
  someone running `bun add` or `bun update` on bun < 1.4 and committing the
  rewritten lock. That would fail loudly, because `kind-validator.test.ts`
  breaks. It would not fail silently.

## Checks run (2026-09-30, worktree /home/user/wt-ts7)

| check | result |
|---|---|
| `bun install --frozen-lockfile` (bun 1.4.2, clean node_modules) | ok, 383 packages |
| `bun run typecheck` (TS 7.0.2) | exit 0, 0 diagnostics, 8–12 s (TS 6.0.3: 33 s) |
| `eslint .` | 0 errors, 5 warnings — identical to `main` |
| `bun run gen:jsonld:check` | up to date |
| `bun test` on 72 files touching the API importers, gates, workflow | 1382 pass / 3 fail; `workflow-yaml` fixed on the branch; the other 2 (`prov-qaqc` real-repo, `resolution-across-needs` "no `needs`") **fail identically on origin/main** |
| e2e + a11y | not run locally (browsers); its only #910 failure was the frozen lockfile |

## Not done, and why

- **Porting the four importers to `typescript/unstable/*`.** `u2ol` names that as
  a re-architecture onto an unstable API, and it is the owner's risk call.
  Side-by-side avoids it.
- **No PR opened, and #910 not touched.** Per instruction.
- **No `engines.bun` bump.** It would protect against the 1.3.11 re-resolve
  above, but it would also refuse every session container on 1.3.x. That is the
  owner's call.

## When side-by-side can be retired

When typescript-eslint supports TS 7 (#10940). At that point `typescript` can be
TS 7 itself. The four importers then still need `@typescript/typescript6` or an
`unstable/` port.

## Done when

- [x] CI's red on #910 reproduced and its real cause named (frozen lockfile)
- [x] Every TS 7 breakage enumerated, with versions and error text
- [x] Side-by-side arrangement on the branch: typecheck on TS 7, lint and API on TS 6.0.3, all fast checks green locally
- [ ] Branch CI (full `code-quality-gates`, e2e, jsonld) green on a PR
- [ ] Owner decides: adopt side-by-side (merge), or keep the 2026-09-27 hold
