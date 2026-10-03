---
# folio-assistant-9c7h
title: Move fsh-guts/ to its own special branch cat/cat-harness/fsh-guts (separation prerequisite); retarget its tools
status: in-progress
type: task
priority: normal
created_at: 2026-10-02T21:20:17Z
updated_at: 2026-10-03T08:34:43Z
parent: folio-assistant-7x5n
---

Owner, 2026-10-02, verbatim: "bean: as pre-requistie as part of separation, fsh-guts content gets its own named branch, cat/cat-harness/fsh-guts and the contents of fsh-guts/ dir goes there. will need to update the tools associated to this, like with other special named branches."

Branch name updated 2026-10-02 per the owner's naming ruling, `cat/<harness>/<name>` (note on `fs43`). The owner asked for "cat-fsh-guts" before that ruling.

## Why
`fsh-guts/` is the kept trashcan (skill `kg/kg-core/fsh-guts`): deprecated or relocated material that is never rendered or published. Today it sits on `main` as a top-level directory (~140 files: `retired/`, `samples/`, `scripts/`, `uploads/`). It is a non-instance store (bean `wggr` §"Collision to watch"), so it does not partition cleanly into cat-harness or cat-harness-tools at the split. Moving it to its own special branch takes it out of the separation's partition entirely. That is why the owner made this a **prerequisite** of 7x5n.

## Scope
1. **Declare it.** Add an `fsh-guts` row to `cat-harness/scripts/special-branches.json`, with name `cat/cat-harness/fsh-guts`, shape `branch` and no legacy name, because it is a new branch. This file arrives with PR #1913 / bean `32f6` (merge train 6, #1924), so this bean starts after that lands. When the `storage` field from `rva2` lands, the row folds into it like the others.
2. **Seed the branch.** Create `cat/cat-harness/fsh-guts` holding the current contents of `fsh-guts/`, with history preserved if practical (`git subtree split --prefix=fsh-guts`). Creating a branch is outward-facing, so confirm with the owner before pushing it.
3. **Retarget the tools.** Every reader and writer of `fsh-guts/` resolves it through the special-branches declaration (a worktree or fetch of `cat/cat-harness/fsh-guts`) instead of a path on `main`. Found on `main` at 2026-10-02 (a `git grep` survey; re-run before starting):
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
- [ ] `cat/cat-harness/fsh-guts` exists with the contents of `fsh-guts/` (owner confirmed the push)
- [ ] every tool listed above reads and writes through the declaration; `bun run gates` green
- [ ] relocation ("delete means relocate") writes to the branch, and an end-to-end test proves it
- [ ] `fsh-guts/` removed from `main` after the owner confirms
- [ ] the separation partition (`instance-rules.ts`) no longer has an fsh-guts case

Related: `32f6` (cat- prefix; PR #1913), `rva2` (one storage field per special branch), `wggr` (non-instance stores), `oi3h` (fsh-guts visualiser).

_2026-10-03T00:50:36Z_ — Claimed by claude/lucid-shannon-o8zop1-fsh-guts — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).


## 2026-10-03: the last unknown writer, traced (no hidden code writer)

The step-3 inventory had marked `board-relocate.bpmn`'s relocate handler as unclear. Traced on main@d089aca961:
- `A_MoveContent` ("Relocate the content to the trashcan") is an AGENT task carrying skills (`board-diagram-interchange`, `deletion-requires-confirmation`). No service task and no code handler.
- No server route, script or tool writes into fsh-guts for a relocation. The grep hits are unrelated: kg-audit relocates QA sidecars, and `routes/branches.ts` "discard" is a git discard.
- The UI only READS. The dead-fish viewer fetches the published `fsh-guts.json` export. #1926's "discard to fsh-guts" is browser-local ("stickies you discarded in this browser") and never writes to the repository.

**So the complete writer list for the cutover is:** `sample-import-run.ts` (already resolved through `fshGutsDirectory`, #1945); the log writer (local scratch, stays in the working tree by design); and AGENTS following the `fsh-guts`, `deletion-requires-confirmation` and `board-diagram-interchange` skills, plus the relocate steps of `activity-log.bpmn`, `code-change-review.bpmn` and `sample-import.bpmn`. For those, step 3 is an INSTRUCTION change ("mount, move into the mount, `branch-store push`" instead of `git mv` into fsh-guts/), made once the content-source resolver from the 2026-10-03 subgraph-source ruling lands.
