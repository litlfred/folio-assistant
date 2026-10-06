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
- [x] skill:register, skill:register:check, render:bpmn:check, kg:audit:check, typecheck, nearest tests, gates attempted

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

- [ ] owner answers the open decisions below
- [ ] PR opened and green (the branch is local only; this session did not push)

## Validation (2026-10-06, branch agent/ig-create-subkg)

skill:register (two passes to a fixed point) and skill:register:check: green. render:bpmn:check: green. kg:audit:check: OK, with no new gated finding. `activity-skill-has-tool` is minor and reported, not gated. `skill-voice-review-current` was not run. typecheck: green. check:process-bindings and check:fhir-harness-exclusions: green. check:reference-direction: no new higher instance named. The 196 nearest tests and bpmn-pot-current pass.

`bun run gates` hit the 9-minute limit inside `bun test`. The one failure it showed is `navbar-assets.test.ts`: the navbar.js bundle differs from the generator, and this branch does not touch it. `regen` left audit:coverage:strict and fsh-guts:viz unrepaired, because the fsh-guts branch is not mounted in this worktree.

## Open decisions for the owner

1. Should `init-folio` gain a `--staged <path>` mode that writes a staged declaration (repository, livesAt, platform.ts) instead of a whole repository? (1) yes, build it *(recommended)*; (2) no, keep it hand-written. Default: (2).
2. Should stage 11, the fresh-clone check, become a command the way `seed:ready` did? (1) yes *(recommended)*; (2) leave it as a manual step. Default: (2).
3. After cutover, should the host (1) delete its copy *(recommended)* or (2) keep a read-only mirror? Default: (2), until asked per instance.

## Owner rulings, 2026-10-06 ("1 2 y / 3 read only mirror in fsh-guts")

1. **Yes**: `init-folio --staged <path>` writes the in-repo declaration of a staged sub-KG (its `<name>.json` with `repository` + `livesAt`, its graphs, the import seam), not a whole repository's 15 files.
2. **Yes**: the fresh-clone check becomes a command (as `seed:ready` did): clone the new repository into a scratch directory, install, run its gates, report.
3. **After cutover the host keeps a READ-ONLY MIRROR in fsh-guts**: not a deletion, and not a second editable copy. The mirror lives on the fsh-guts surface and is refreshed from the separated repository; a hand edit to it is a defect.

## Todo (from the rulings)
- [ ] `init-folio --staged <path>`, with a test that it writes the declaration and nothing at the repository level
- [ ] fresh-clone verification command (`sub-kg:verify-clone` or similar), declared as a Tool, called by the lifecycle's verify task
- [ ] lifecycle: replace "retire the in-repo copy" with "mirror read-only into fsh-guts"; the owner-confirmation task stays, now before the switch to the mirror
