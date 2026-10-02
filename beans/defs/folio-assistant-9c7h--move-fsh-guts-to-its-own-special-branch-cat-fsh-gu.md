---
# folio-assistant-9c7h
title: Move fsh-guts/ to its own special branch cat-fsh-guts (separation prerequisite); retarget its tools
status: todo
type: task
created_at: 2026-10-02T21:20:17Z
updated_at: 2026-10-02T21:20:17Z
parent: folio-assistant-7x5n
---

Owner, 2026-10-02, verbatim: "bean: as pre-requistie as part of separation, fsh-guts content gets its own named branch, cat-fsh-guts and the contents of fsh-guts/ dir goes there. will need to update the tools associated to this, like with other special named branches."

## Why
`fsh-guts/` is the kept trashcan (skill `kg/kg-core/fsh-guts`): deprecated or relocated material that is never rendered or published. Today it sits on `main` as a top-level directory (~140 files: `retired/`, `samples/`, `scripts/`, `uploads/`). It is a non-instance store (bean `wggr` §"Collision to watch"), so it does not partition cleanly into cat-harness or cat-harness-tools at the split. Moving it to its own special branch takes it out of the separation's partition entirely. That is why the owner made this a **prerequisite** of 7x5n.

## Scope
1. **Declare it.** Add an `fsh-guts` row to `cat-harness/scripts/special-branches.json`, with name `cat-fsh-guts`, shape `branch` and no legacy name, because it is a new branch. This file arrives with PR #1913 / bean `32f6` (merge train 6, #1924), so this bean starts after that lands. When the `storage` field from `rva2` lands, the row folds into it like the others.
2. **Seed the branch.** Create `cat-fsh-guts` holding the current contents of `fsh-guts/`, with history preserved if practical (`git subtree split --prefix=fsh-guts`). Creating a branch is outward-facing, so confirm with the owner before pushing it.
3. **Retarget the tools.** Every reader and writer of `fsh-guts/` resolves it through the special-branches declaration (a worktree or fetch of `cat-fsh-guts`) instead of a path on `main`. Found on `main` at 2026-10-02 (a `git grep` survey; re-run before starting):
   - **Export, visualiser, schema:** `fsh-guts-export.ts`, `gen-fsh-guts-viz.ts`, `schemas/fsh-guts.ts`, `state-visualizer.ts`, `harness-tiles.ts`.
   - **Processes that relocate into it ("delete means relocate"):** `processes/sdlc/activity-log.bpmn`, `processes/sdlc/code-change-review.bpmn`, `processes/library/sample-import.bpmn`.
   - **Checks and audits:** `check-subgraphs.ts`, `check-subgraph-coverage.ts`, `check-uploads-retired.ts`, `check-retired-front-matter.ts`, `check-quiet-claim-liveness.ts`, `check-declaration-filename.ts`, `kg-audit.ts`.
   - **Pipeline:** `derive-po.ts`, `pot-extract.ts`, `qa-utils.ts`, `gen-docs-auto.ts`.
   - **Separation:** `partition/instance-rules.ts`.
   - **Config:** `cat-harness/cat-harness.json` (the `fsh-guts` directory entry and graph kind), `graph-kind-registry.ts`.
   - **CI:** `.github/workflows/code-quality-gates.yml`, `docs-site.yml`, `feature-staging.yml`, plus `.gitignore` and `bunfig.toml`.
   - **Tests:** `fsh-guts-*.test.ts`, `archive-contents.test.ts`, `activity-log.test.ts`, `check-*.test.ts`.
4. **Remove `fsh-guts/` from `main`.** This needs the owner's explicit confirmation (`deletion-requires-confirmation`), even though the content survives on the branch. Report file counts and the branch SHA first.
5. **Update the skills.** Update `kg/kg-core/fsh-guts` ("where it lives") and the special-branches section of the skill that documents them.

## Done when
- [ ] `fsh-guts` declared in `special-branches.json`, with the test green
- [ ] `cat-fsh-guts` exists with the contents of `fsh-guts/` (owner confirmed the push)
- [ ] every tool listed above reads and writes through the declaration; `bun run gates` green
- [ ] relocation ("delete means relocate") writes to the branch, and an end-to-end test proves it
- [ ] `fsh-guts/` removed from `main` after the owner confirms
- [ ] the separation partition (`instance-rules.ts`) no longer has an fsh-guts case

Related: `32f6` (cat- prefix; PR #1913), `rva2` (one storage field per special branch), `wggr` (non-instance stores), `oi3h` (fsh-guts visualiser).
