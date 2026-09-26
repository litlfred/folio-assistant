---
# folio-assistant-gw8h
title: A scripts/ -> cat-harness/scripts/ rewrite doubled six hrefs and left the glossary stale — two red checks on every open PR, one cause
status: todo
type: bug
priority: high
created_at: 2026-09-26T14:16:58Z
updated_at: 2026-09-26T14:16:58Z
---

## Two red checks on `main`, in two different jobs, from one edit

Measured 2026-09-26 in a clean worktree of pristine `origin/main` at
`f850f721a06`, so neither is any PR's:

| job | check | failure |
|---|---|---|
| `TypeScript — tests, lint, types (hard)` | `bun test` | `the entanglement report > the dangling category exists and is computed, not skipped` — 6 dangling links |
| `Repository gates (hard)` | `check:glossary` | 3 derived artefacts stale |

## The cause

A `scripts/` → `cat-harness/scripts/` rewrite, left over from the pre-split
move, was applied to each link's **text** *and* to its **href**. From
`cat-harness/skills/folio-paper-adapter/`, `../../` already **is**
`cat-harness/`, so every rewritten href resolves to
`cat-harness/cat-harness/scripts/…`:

```
skills/folio-paper-adapter/document-intake.md    -> ../../cat-harness/scripts/pdf-extract.py
skills/folio-paper-adapter/document-intake.md    -> ../../cat-harness/scripts/pdf-structure.py
skills/folio-paper-adapter/document-intake.md    -> ../../cat-harness/scripts/pdf-ocr.py
skills/folio-paper-adapter/document-intake.md    -> ../../cat-harness/scripts/extract-candidates.py
skills/folio-paper-adapter/latex-build-cache.md  -> ../../cat-harness/scripts/install-tex.sh
skills/folio-paper-adapter/latex-build-cache.md  -> ../../cat-harness/scripts/feature-build.sh
```

All six targets exist at `cat-harness/scripts/…`, verified individually — so
this is a prefix DOUBLED, not a file moved. The link text is correct; only the
href is wrong, which is why reading the rendered page does not show it.

The same edit changed `latex-build-cache.md`'s description text, and the three
glossary artefacts derived from it were never regenerated. One edit, two
symptoms, two jobs — which is why the two failures never looked related.

## Why it cost more than six links

`check:glossary` is step ~470 of the `Repository gates` job's ~877 lines, and a
job stops at its first failing step. So every gate AFTER it never ran, on this
branch and on every other open PR. That is the `om30` masking shape again, one
job over: the gates were asked for and the answers were never produced.

## The fix

Six hrefs `../../cat-harness/scripts/` → `../../scripts/`, then
`bun run glossary:page`. Five files, nine lines.

Falsified by the pristine-main control rather than by a synthetic break, and
it is the same evidence in both directions: at `f850f721a06` without these
changes `check:glossary` exits 1 on three named files and the entanglement
test fails with six findings; with them, `check:glossary` exits 0 and
`subgraphs.test.ts` is 18 pass / 0 fail.

## What was checked and is NOT here

A scan for the same doubled prefix elsewhere under `cat-harness/skills/`,
at both `../../cat-harness/` and `../../../cat-harness/` — no other occurrence.
So this is the whole of that rewrite's damage, not a sample of it.

## Done when

- [x] the six hrefs resolve
- [x] the three glossary artefacts regenerated
- [x] no other instance of the doubled prefix under `skills/`
- [ ] merged, so the gates after step 470 run again for every open PR
