---
# folio-assistant-flh4
title: 'STATE PAGES: a graph whose declaration names a visualiser is reported as having none — the missing third state'
status: completed
type: task
parent: folio-assistant-yj32
created_at: 2026-09-20T21:26:38Z
updated_at: 2026-09-20T21:26:38Z
---

`cat-harness/docs/uploads/index.html` says "This graph is declared and nothing publishes a projection for it yet", while `harness.json` AND `cat-harness/harness.json` both give it a `coverage.visualiser`, that page exists, and it renders live per-instance queue counts (4/4/0, 28/2/26, 1/1/0). The page contradicts the repository's own declaration.

Cause: `projectionFor(id)` in `state-visualizer.ts` asks the disk for `assets/<id>/index.json` only. `uploads` publishes its queue block inside `assets/library/index.json`, so "no projection AT MY PATH" was collapsed into "nothing renders this". Two different facts.

Measured 2026-09-20 across both declarations: `uploads` is the ONLY graph with this defect. `qa`, `health` and `issue-marks` carry no `coverage.visualiser`, so their pages are honest; `beans` and `todos` are live.

## Done when
- [x] A graph whose declared `coverage.visualiser` resolves on disk links to it instead of claiming nothing renders it
- [x] A declared visualiser that does NOT resolve is reported as a defect, never rendered as either state
- [x] Falsified both ways in tests, and qa/health/issue-marks still say what they say now

## Summary of Changes

Merged as `89d1b5b5` (PR #619, issue #618). All three `## Done when` items
satisfied; the evidence is in the diff and in the falsification table below.

**What shipped.** `GraphState` went from two values to four, because there
were four facts and two of them were being collapsed:

| state | projection at this generator's path | declaration names a visualiser |
|---|---|---|
| `live` | yes | — |
| `elsewhere` | no | yes, and it resolves |
| `declared` | no | no |
| `unresolved` | no | yes, and it is NOT there |

`uploads` was the only graph affected. `qa`, `health` and `issue-marks`
declare no visualiser, so their pages were already honest and did not move —
which is what makes this a fix rather than a rewrite.

**The generator is now in `render-pipeline.ts`**, at stage 2 with
`needs: ["docs-pages"]`. That dependency is real: the state of each graph is
decided by whether `assets/<id>/index.json` is on disk, and `gen-docs-pages.ts`
is what writes it. Run the other way round, `beans` and `todos` render as
`declared` and the build exits 0 — this bean's own defect, reappearing as a
scheduling problem.

**Two traps, both found by measuring rather than assuming.**

- `coverage.*` is **repo-root** relative while a directory's `path` is
  **instance**-relative, and `ROOT` in this generator is `cat-harness/`. Of 27
  coverage paths, 25 resolve only from the repo root and **none** from the
  instance root alone. `join(ROOT, cov)` would have marked every declared
  visualiser missing and shipped a page of false defect reports. Undocumented;
  offered to the owner as a separate bean, not yet opened.
- The CSS block is inside a template literal, so a backtick in a comment ends
  the string. Four of mine did.

**Falsified both ways rather than only asserted:**

| break introduced | tests that fail |
|---|---|
| collapse `unresolved` into `elsewhere` | 2 |
| resolve coverage against the instance root | 8 |

`unresolved` fires on nothing in this corpus, so the resolver moved behind
`import.meta.main` (97 of 135 scripts here already use it) and takes its roots
as an argument — a branch no test can reach is wrong the first time it matters.

**Two gates caught real defects in the first draft**: `site-dir-single-answer`
(the test fixture hardcoded the site root — that rule exists because getting it
wrong once unignored 3,080 files) and `check:bean-parents`.

73 gates pass. Verified by rendering the page in chromium, which is also how
the next item was found.

## Found, not fixed

The registry's descriptions carry **raw backticks** from the declaration and
render them literally instead of as code — `test/health/`, `lastCommentId`,
`beans/`. Invisible in a diff, obvious in the render. Pre-existing and
unrelated to this change, so it was recorded rather than folded in. No bean
opened yet; offered to the owner.

