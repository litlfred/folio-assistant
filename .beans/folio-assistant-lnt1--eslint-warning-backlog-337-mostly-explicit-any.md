---
# folio-assistant-lnt1
title: 'ESLint warning backlog: 213 remaining, 201 of them no-explicit-any'
status: todo
type: task
priority: normal
created_at: 2026-08-07T18:00:00Z
updated_at: 2026-08-07T19:35:00Z
---

`bun run lint` now runs (it never could before — no config, and neither
`eslint` nor `typescript-eslint` was a dependency). It exits 0 with **337
warnings**, deliberately: a rule is an ERROR in `eslint.config.mjs` only once
its count is zero, so a red lint always means a regression rather than
pre-existing debt.

Counts at the time the config landed, over 194 files:

| rule | count | note |
|---|---:|---|
| `@typescript-eslint/no-explicit-any` | 201 | gradual typing — a project-wide call, not a drive-by |
| `@typescript-eslint/no-unused-vars` | 111 | dead bindings; real cleanup, needs review per site |
| `@typescript-eslint/no-require-imports` | 13 | CommonJS holdouts |
| `@typescript-eslint/no-unsafe-function-type` | 10 | bare `Function` types |
| `@typescript-eslint/no-this-alias` | 2 | |

`prefer-const` was driven to **0** (15 auto-fixed) and is already an error.

## How to drain

Take ONE rule at a time, drive it to zero, then promote it from the warn
block to the error block in `eslint.config.mjs`. That keeps the gate green
throughout and makes each promotion a permanent ratchet.

`no-unused-vars` is the best first candidate: mechanical, and `--fix` does
not touch it so every removal gets looked at. Note the config already honours
the `^_` convention for deliberately-unused bindings, so the remaining 111 are
genuinely unreferenced rather than marked-intentional.

`no-explicit-any` is the largest and the least mechanical — it is a typing
decision per site, and probably wants its own plan rather than a sweep.

## Already paid off

The parse check alone found a live bug on its first run:
`scripts/generate-docs.ts` had `skills/*` + `/package-manifest.json` inside a
JSDoc block, and that `*` immediately followed by `/` closed the comment
early, leaving the rest parsed as code. bun could not load the file at all.
Fixed; the script now imports and runs.


## Drained: `no-unused-vars` 111 -> 0, promoted to ERROR

First rung of the ratchet. 337 -> 226 warnings; a new unused binding now
FAILS the lint (verified with a probe file).

Removed 70 unused import members, 5 fully-dead non-exported functions, and the
dead locals. Verified after every batch with `tsc --noEmit` + the 269-test
suite; both clean throughout.

### What it surfaced — dead bindings were hiding dead CHECKS

Not all of these were tidy-ups. Several were computations whose result was
discarded, i.e. a check that silently did nothing:

- **`adapters/mcp-server/server.ts` — swallowed build failure. FIXED.**
  `spawnSync("bun run content/pipeline/build.ts")`'s result was discarded, so
  a failed or timed-out content build was invisible and the lightning `.tex`
  was then assembled from stale or missing output. Now checks `status` and
  logs, matching the sibling spawnSync sites. Hard-failing may be the better
  end state — left as a follow-up rather than changing control flow untested.

- **`proof-narrative-lean-equiv-sweep.ts` — a check that was never wired.**
  `const mdStatement = extractMdStatement(mdText)` under the comment
  "Check if .md has a statement", result never used. `extractMdStatement` had
  exactly one caller — that line. So the md-statement check has never run.
  Both removed; **the check itself is still unimplemented** and someone should
  decide whether it is wanted.

- **`validate-bib.ts` — `yearMatch`** computed from the description and
  discarded. Same shape: a year check that does not happen.

- **`scripts/lean-audit.ts` — `witnessedFiles` / `pendingFiles`** partitioned
  and never reported.

- **`scripts/headless-render-qc.ts` — `appJs`** read from the viewer and
  unused. Harmless to remove, but it exposes something worth knowing: the QC
  page defines its **own** inline `mdToHtml` (line ~119) rather than using the
  viewer's. So headless render QC validates a COPY of the render logic and can
  pass while the real viewer differs. Worth its own bean.

Two were deliberate leftovers whose comments already explained them
(`isArchimedean` superseded by `hasRealType` in the wall checker;
`maskedLines` superseded by comments-only masking in the float checker) —
removed the bindings, kept the reasoning.

## Next rung

`no-explicit-any` (201) is the only substantial one left. It is a per-site
typing decision rather than a sweep, and probably wants a plan before anyone
starts. `no-require-imports` (13) is the cheapest next ratchet.


## Second rung: `no-require-imports` 13 -> 0, promoted to ERROR

226 -> 213 warnings. Verified with a probe file that a new `require()` now
fails the lint.

All 13 were lazy inline `require()` of Node builtins (`fs`, `child_process`)
inside function bodies — a CommonJS idiom in an ESM/TS codebase. Deferring a
builtin's load buys nothing, and six of the eight files already imported the
same module at top level, so this was mostly widening an existing member list:

| file | hoisted |
|---|---|
| `adapters/mcp-server/git.ts` | `symlinkSync`, `readdirSync` -> existing `fs` import |
| `src/core/git.ts` | `symlinkSync`, `readdirSync` -> existing `fs` import |
| `adapters/mcp-server/server.ts` | `readdirSync` -> existing `fs` import |
| `adapters/paper/index.ts` | 3 sites -> one `child_process` import |
| `adapters/mcp-server/paths.ts` | inline `require("fs").readFileSync(…)` -> named import |
| `content/pipeline/proof-axis-dashboard.ts` | `execSync` |
| `scripts/tests/lean-projects.test.ts` | `execSync` |
| `src/routes/branches.ts` | 2 sites -> one `child_process` import |

No behaviour change: the `try` blocks around these calls guard the OPERATION
(a symlink that may already exist, a `git` that may be absent), not the module
load.

## Remaining: 213

| rule | count |
|---|---:|
| `no-explicit-any` | 201 |
| `no-unsafe-function-type` | 10 |
| `no-this-alias` | 2 |

`no-this-alias` (2) and `no-unsafe-function-type` (10) are the next cheap
rungs. `no-explicit-any` is the only substantial one and is a per-site typing
decision rather than a sweep — it wants a plan before anyone starts.
