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

`schemas/**` is in scope now and is clean. `content/**` is not, but is
draining: **48 -> 26 errors**.

    8  content/pipeline/validate-bib.ts
    4  content/pipeline/audit-wiring.ts
    3  content/pipeline/bib-qa.ts
    2  content/pipeline/validate-references-human-review.ts
    2  content/pipeline/export-json.ts
    2  content/pipeline/export-bibtex.ts
    5  spread over 5 more files

`render-latex.ts` is done: 21 -> 0. Sixteen were unnarrowed reads of `content`
/ `args` off the 13-member `LatexNode` union, now behind three accessors. One
was a TS2367 that turned out to be a DEAD CHECK — see below.

`scripts/**` is untried beyond a rough count (~15 more, several in test files).

Drain `content/**` to zero, then add it to `include` — the ratchet
`eslint.config.mjs` documents, so a red typecheck always means a regression.

Also found by widening: `checkBareHash` in `render-latex.ts` tested
`node.type === "parameter"`, a node type unified-latex does not have (it has
exactly thirteen, and that is not one), so the arm could never match. The
`string` arm beside it does the work — confirmed against the parser, which
emits `string:"#"` for a bare `#` in all four shapes tested. Arm removed
rather than left as false reassurance about coverage.

Adjacent, found while measuring and since FIXED (bean `folio-assistant-vald`):
`content/pipeline/validate.ts`
resolves its content root from its own file location, so run from a folio it
looks in `<platform>/content/objects`, finds no manifests, and reports
`✓ Valid — 1 issue(s)`. Same root-resolution defect class as the one fixed in
`q-usage-audit.ts` (`findContentRepoRoot`). With that and two further defects
fixed, the folio validates end-to-end for the first time: `fred2005-formal-groups`
0 issues, `quantum-observable-universe` 0 issues, exit 0.
