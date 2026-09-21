---
# folio-assistant-3jj9
title: 'BOOTSTRAP: shrink to what it owns, and add the discussion process'
status: completed
type: task
priority: normal
created_at: 2026-09-20T09:10:53Z
updated_at: 2026-09-20T09:35:46Z
parent: folio-assistant-vke6
---


## Measured

`bootstrap/bootstrap.jsonld`: **49 nodes / 807 lines → 34 nodes / 687 lines.**
GraphKind nodes **16 → 1**. `check:instance-render` now reports bootstrap as
`1 declared, 1 published`.

## Two of the four "removals" were wrong, and reading said so

**Duplicate Role nodes — NOT a defect.** Six nodes for three roles looked like
the `blv9` shape. `kg-export.ts` documents the opposite: lane-derived nodes are
kept deliberately and a declared role joins them via `bindsLane`. And
`roles.json`'s own `_lanes_comment` records why `lanes` is omitted — adding it
produced *"three dangling links, measured 2026-09-20"* in the ROOT graph,
because the root declares `bootstrap/skills/` and not `bootstrap/workflows/`.
That asymmetry is bean `pve3`. Removing the nodes would have widened the
dangling-link allowance and recorded new debt as progress.

**`kg-navigation.md` — a RENAME, not a deletion.** It looked droppable because
the docs generator silently prefers folio-core's. But
`initialize-harness.bpmn` REFERENCES it: deleting it would have broken the one
process bootstrap had. Measured for `v3se`, which asked for exactly this
before choosing a fix: `skill_fetch` resolves over PACKAGES —
`authoring-who-smart-guidelines, folio-document-adapter, content-lifecycle,
folio-core, authoring-math, folio-paper-adapter, folio-assistant` — and
**bootstrap is not one**. So the body was reachable by neither resolver.
Renamed to `bootstrap-kg-navigation`, front matter included, which is what
`declaredName` caught when the two disagreed.

## One root cause under three symptoms

`pve3` — the root declares `bootstrap/skills/` but not
`bootstrap/workflows/` — explains the empty `bindsLane`, the unaudited
process, AND the orphan sidecar nothing pruned. Not fixed here: it is its own
bean and the fix is a declaration decision, not a cleanup.

## The orphan sweep found nine, not one

`kg-audit` compared each report to its file and never looked the other way, so
a sidecar whose subject moved was structurally invisible. The sweep added here
found `bootstrap/workflows/bootstrap.kg-qa.json` — auditing a path that does
not exist — and **eight more** under `folio-core` and `folio-paper-adapter`
whose subject files DO exist but which the audit's 256 subjects no longer
discover. Those eight are reported, not deleted: their verdicts are real and
the cause is discovery, not staleness.

**AMENDED 2026-09-20 — the last sentence above is WRONG, and the correction is
the useful part.** Neither half held. The cause is not discovery: all eight
declare `part-of:` in their front matter and are excluded by `isPartOfASkill`
**deliberately and correctly**, a predicate added 2026-09-19 (`179f1f0998`)
because splitting five over-length skills had turned 5 findings into 4 new ones
measured against their own fragments. And their verdicts are not real: the
sidecars were written 2026-09-18, BEFORE that predicate existed, so each one
measures a fragment against thresholds meant for a whole skill. They are stale
residue, not evidence. There is no discovery bug among them, and "fixing
discovery" on the strength of the original sentence would re-admit eight
fragments and re-introduce the findings `179f1f0998` removed.

**The count is also no longer nine.** It is twelve: the `bootstrap/workflows/`
one is gone, and four new dead sidecars arrived from two skill-package moves on
2026-09-20 (`790ec2fe48`, `2fe43d5bb2`), each with a live replacement under
`skills/workflow/` carrying identical totals.

**How the wrong diagnosis happened, since that is the reusable part.** The
sweep asked ONE question — is this path in `written`? — and then offered the
reader a guess between two causes in its own output: *"Either the subject moved
and the sidecar should go, or it is no longer discovered from this root and the
DECLARATION is what is wrong."* I wrote that guess down here as a finding. The
sidecar already records `subject.path`; the sweep read only the filename and
threw it away. One `existsSync` splits "the file is gone" from "the file is
there and was not audited" mechanically — opposite responses — and the sweep
now does that, with a test.

**The sweep itself shipped broken first.** It walked `KG_QA_DIRNAME`
(`"kg-qa"`) instead of `KG_QA_RESULTS_DIR`, so `readdirSync` threw, the catch
returned, and it reported a clean sweep over nothing. Caught only by putting
the orphan back and watching the guard stay silent.

## check-tools had a second, wrong skill discoverer

`discuss`'s `satisfies: ["discussion"]` was flagged as naming no skill. The
skill was there: `check-tools.ts` carried its own `knownSkills()` scanning
`kgRoots(ROOT)[0]` — the FIRST declared root — which is the defect `AGENTS.md`
names explicitly. The shared `known-skills.ts` finds 176 including
bootstrap's; that copy found none. Now reads the shared one.

## The undeclared-kind finding is fatal, as its own test predicted

The test written in #463 read: *"this test is what will fail, correctly, on
the day somebody makes it fatal without clearing the count."* The count is
cleared, so it is fatal, and the test now asserts the fixed state with a
vacuity guard — `undeclared: []` is satisfied trivially by publishing nothing.

## The addition

`discussion` — skill body, input schema, output schema, BPMN process, and the
`discuss` Tool node in cat-harness (bootstrap may not import it). `invoke:
{ manual: true }`, per the `beans-manual` precedent that a hand-performed
mechanism has equal standing; `conversation: true` was the first draft and
`tsc` correctly refused a new invoke kind for one tool.

Verified: 43 gates, 3328 tests / 0 fail, tsc clean, eslint clean.
