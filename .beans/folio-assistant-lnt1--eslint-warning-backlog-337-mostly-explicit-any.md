---
# folio-assistant-lnt1
title: 'ESLint warning backlog (337): 201 no-explicit-any, 111 unused vars'
status: todo
type: task
priority: normal
created_at: 2026-08-07T18:00:00Z
updated_at: 2026-08-07T18:00:00Z
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
