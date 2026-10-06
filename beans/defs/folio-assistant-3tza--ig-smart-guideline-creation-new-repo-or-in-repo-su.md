---
# folio-assistant-3tza
title: 'IG / SMART Guideline creation: new repo or in-repo sub-KG, and the sub-KG lifecycle (stage, seed, re-point, cutover) extracted from the smart-* separation'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-06T07:13:44Z
updated_at: 2026-10-06T07:13:52Z
parent: folio-assistant-uhkv
---

Owner, 2026-10-06, verbatim: *"add new skill/process: when asked to create a new FHIR IG or Smart Guideline, that can either be done in a new repo or within the folio of an existing harnessed repo. the agent should determine users intent and act accordingly. if user creates it in a folio/, then it can move it to another repo later (this is essentially the create a sub-KG process and skills we have been doing in last week and lots of process/skills can be extracted in retrospect. once the sub KG is staged for separation in a repo, a new repo is created and staging contents copied into it)"*.

Branch `agent/ig-create-subkg` (local, not pushed).

## What already existed, and is built on rather than restated

- `getting-started` triages "create a folio" (five intents, `folio-intent.dmn`); `init-folio` scaffolds `paper | document` or `--instance`, with no IG type.
- `kg-separation` (+ `kg-separation.bpmn`, `seed:ready`, `seed-readiness-gate.dmn`) is the heavy method: a content + tools PAIR, 14 stages.
- The smart-* separation (n3ni, stages A-F) did a LIGHTER thing that no skill described: a data instance staged in place, one import seam, a guard, a fork rehearsal, a seed with history, re-pointing, a cutover on the owner's OK.

## Done when

- [x] survey recorded here (retrospective steps below)
- [x] `fhir-ig-create` skill in fhir-harness (intent question, routes to init-folio or the in-repo sub-KG path), FHIR-generic only
- [x] `smart-guideline-create` skill in smart-base (the SMART specialisation: layout rulings, fork-first, chrome owner)
- [x] `sub-kg-lifecycle` skill + `sub-kg-lifecycle.bpmn` in cat-harness, with owner-confirmation before repository creation and before deleting the in-repo copy
- [x] `getting-started` points to the new route without naming a higher layer
- [ ] skill:register, skill:register:check, render:bpmn:check, kg:audit:check, typecheck, nearest tests, gates attempted

## Retrospective steps extracted (sources)

| # | step | where it was done |
|---|---|---|
| 1 | declare the instance in place: `<name>/<name>.json` with `repository` (planned), `livesAt` (today), `needs`, only directories that exist | identity bean 6rmv; dh4f; smart-trust staged as a root sibling (owner 2026-09-21) |
| 2 | push generic down first, fix wrong-direction edges in declarations as well as imports | n3ni stages A-C: #1768, r939 #1782, y4t4 #1783; proposal smart-separation-2026-10-01 |
| 3 | consolidate the layer the sub-KG needs (theme, chrome, DAK code) | kg83 #1795 |
| 4 | one import seam per instance, `<name>/platform.ts` | 6f19f9100 (#1767), a93da7d41 (#1860) |
| 5 | the separation guard covers every staged instance, with checked ceilings | instance-separation-imports.test.ts, #1860 |
| 6 | self-contained check: rehearse in a fork; static scan found 20 of 23 platform files; directory rename changed every page, so identity comes from the declaration | rbz3, litlfred/smart-trust#3, 853f9532 |
| 7 | owner settles the layout questions, numbered with defaults | proposal Q1-Q7; rbz3 "2" |
| 8 | the owner creates the repository | separation-arc G6 (2026-10-01) |
| 9 | seed with history on a branch, as a draft PR, never to main before review | litlfred/smart-trust#5 (378 commits, subtree split + add); seed:ready hcpz |
| 10 | re-point: subscription for read content, submodule for imported code; platform.ts one-file edit; livesAt drops | separation-arc G5/S8; fnx4 kg:subscribe |
| 11 | verify from a fresh clone; measured falsifier "Cannot find module ../../../fhir-harness" | #2082, w1gy |
| 12 | cutover deletes the in-repo copy only on the owner's OK | n3ni F, arc S8, deletion-requires-confirmation |
