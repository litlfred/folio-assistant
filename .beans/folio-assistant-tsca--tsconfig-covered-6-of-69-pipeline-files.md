---
# folio-assistant-tsca
title: 'tsconfig covered 6 of 69 pipeline files — 48 errors remain in content/'
status: todo
type: task
priority: normal
created_at: 2026-08-07T23:05:00Z
updated_at: 2026-08-07T23:05:00Z
---

`tsconfig.json` had `"include": ["src/**/*.ts"]`, so `tsc --noEmit -p .`
compiled `src/` plus only what `src/` transitively imports — **6 of the 69**
files in `content/pipeline`, and not `schemas/types.ts` at all.

Every "tsc --noEmit is clean" claim in this repo's recent commit messages was
therefore true and largely vacuous. It cost something real: commit `958c29e`
("lint: drain no-unused-vars 111 -> 0") renamed the `ctx` parameter to `_ctx`
in **seven** `schemas/constraints.ts` checks whose bodies still read `ctx.dir`
and `ctx.fileExists` — `md-exists`, `lean-file-exists`,
`simulator-ref-resolve`, `uses-resolve`, `cites-resolve`, `interprets-resolve`,
`lean-stub-conjecture-kind-check`. A `ReferenceError` in each, in core content
validation, shipped under a green typecheck that never compiled the file. Fixed
in the same change that widened the config.

`schemas/**` is in scope now and is clean. `content/**` is not: **48 errors**,

    21  content/pipeline/render-latex.ts
     8  content/pipeline/validate-bib.ts
     4  content/pipeline/audit-wiring.ts
     3  content/pipeline/bib-qa.ts
    12  spread over 9 more files

`scripts/**` is untried beyond a rough count (~15 more, several in test files).

Drain `content/**` to zero, then add it to `include` — the ratchet
`eslint.config.mjs` documents, so a red typecheck always means a regression.

Adjacent, found while measuring and NOT yet fixed: `content/pipeline/validate.ts`
resolves its content root from its own file location, so run from a folio it
looks in `<platform>/content/objects`, finds no manifests, and reports
`✓ Valid — 1 issue(s)`. Same root-resolution defect class as the one fixed in
`q-usage-audit.ts` (`findContentRepoRoot`); the content validator has been
validating nothing.
