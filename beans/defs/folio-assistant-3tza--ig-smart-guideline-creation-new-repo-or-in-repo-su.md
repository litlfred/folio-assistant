---
# folio-assistant-3tza
title: 'IG / SMART Guideline creation: new repo or in-repo sub-KG, and the sub-KG lifecycle (stage, seed, re-point, cutover) extracted from the smart-* separation'
status: completed
type: feature
priority: normal
created_at: 2026-10-06T07:13:44Z
updated_at: 2026-10-08T04:30:00Z
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
- [x] owner answers the open decisions below (1 yes, 2 yes, 3 frozen copy in fsh-guts)
- [x] PR opened and green (merged in PR #2259)

## Validation (2026-10-06, branch agent/ig-create-subkg)

skill:register (two passes to a fixed point) and skill:register:check: green. render:bpmn:check: green. kg:audit:check: OK, with no new gated finding. `activity-skill-has-tool` is minor and reported, not gated. `skill-voice-review-current` was not run. typecheck: green. check:process-bindings and check:fhir-harness-exclusions: green. check:reference-direction: no new higher instance named. The 196 nearest tests and bpmn-pot-current pass.

`bun run cat gates` hit the 9-minute limit inside `bun test`. The one failure it showed is `navbar-assets.test.ts`: the navbar.js bundle differs from the generator, and this branch does not touch it. `regen` left audit:coverage:strict and fsh-guts:viz unrepaired, because the fsh-guts branch is not mounted in this worktree.

## Open decisions for the owner

1. Should `init-folio` gain a `--staged <path>` mode that writes a staged declaration (repository, livesAt, platform.ts) instead of a whole repository? (1) yes, build it *(recommended)*; (2) no, keep it hand-written. Default: (2).
2. Should stage 11, the fresh-clone check, become a command the way `seed:ready` did? (1) yes *(recommended)*; (2) leave it as a manual step. Default: (2).
3. After cutover, should the host (1) delete its copy *(recommended)* or (2) keep a read-only mirror? Default: (2), until asked per instance.

## Owner rulings, 2026-10-06 ("1 2 y / 3 read only mirror in fsh-guts")

1. **Yes**: `init-folio --staged <path>` writes the in-repo declaration of a staged sub-KG (its `<name>.json` with `repository` + `livesAt`, its graphs, the import seam), not a whole repository's 15 files.
2. **Yes**: the fresh-clone check becomes a command (as `seed:ready` did): clone the new repository into a scratch directory, install, run its gates, report.
3. **After cutover the host keeps a READ-ONLY MIRROR in fsh-guts**: not a deletion, and not a second editable copy. The mirror lives on the fsh-guts surface and is refreshed from the separated repository; a hand edit to it is a defect.

## Todo (from the rulings)
- [x] `init-folio --staged <path>`, with a test that it writes the declaration and nothing at the repository level (`init-folio-staged.test.ts` snapshots the whole host tree; branch agent/3tza-rulings)
- [x] fresh-clone verification command `sub-kg:verify-clone` (`cat-harness-tools/scripts/verify-clone.ts`, Tool `sub-kg-verify-clone` satisfying `sub-kg-lifecycle`), named by the lifecycle's verify task; `verify-clone.test.ts` covers green / red / unknown
- [x] lifecycle: replace "retire the in-repo copy" with a FROZEN copy in fsh-guts/separated/ (ruling 3 clarified: "1"). **Held, not built:** fsh-guts does not fit a refreshed mirror (see below). The confirmation task stays and now says it is not taken past until this is answered.

### Ruling 3: what fsh-guts is, and why it does not fit a mirror as stated

`fsh-guts` (skill `fsh-guts`, `cat-harness/skills/kg/kg-core/fsh-guts.md`) is the **kept trashcan**: "delete means relocate". It lives on its own branch `cat/cat-harness/fsh-guts`, mounted at `fsh-guts/` and ignored on main. It is never rendered and is stripped from every published graph. Every node is a one-time relocation carrying `$schema: folio-fsh-guts/v1`, `movedFrom` and `movedOn`, and a non-markdown file gets a same-basename `.md` sidecar. Nothing in it is refreshed from upstream, and nothing makes it read-only beyond convention.

So a FROZEN copy of the in-repo directory at cutover fits fsh-guts exactly. A mirror **refreshed** from the separated repository does not: that would change what fsh-guts is.

Question for the owner. Which do you mean by "read only mirror in fsh-guts"?
1. **A frozen snapshot** *(recommended)*. At cutover the in-repo directory is relocated to `fsh-guts/separated/<name>/`, with one front-matter node naming the new repository and the commit it matched. It is never refreshed; the live copy is the submodule or subscription from stage 10.
2. **A refreshed mirror outside fsh-guts.** The host keeps the directory, declared `readOnly: true` with a `readOnlyBasis`, refreshed from the new repository. That is what stage 10's submodule or subscription already gives, so nothing goes to fsh-guts.
3. **A refreshed mirror inside fsh-guts.** fsh-guts gains a "mirror" kind refreshed from upstream. This is a new design for fsh-guts and needs its own bean.

Default if unanswered: nothing is deleted or relocated. Stage 13 waits at its confirmation.

## Ruling 3 clarified (owner, 2026-10-06: "1")
A FROZEN copy in fsh-guts: at cutover the in-repo directory moves to `fsh-guts/separated/<name>/` with one note naming the new repository and commit. Built into `sub-kg-lifecycle.bpmn` steps 12-13 and the skill.

## Completed on landed evidence
Landed on main in PR #2259 (commit 7cdd7a1954df, "skills+process(3tza): IG / SMART Guideline creation, and the sub-KG lifecycle") and follow-on commits e5a42b0db475, 2fd9afe417f2, e3ad680b7381.
- Implemented `fhir-ig-create` and `smart-guideline-create` skills.
- Implemented `sub-kg-lifecycle.bpmn` (420 lines) and `sub-kg-lifecycle.md`.
- Implemented `init-folio --staged` and `sub-kg:verify-clone`.
- Implemented frozen snapshot in `fsh-guts/separated/` (ruling 3).
- All criteria verified on main.
