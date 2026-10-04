---
# folio-assistant-9c7h
title: Move fsh-guts/ to its own special branch cat/cat-harness/fsh-guts (separation prerequisite); retarget its tools
status: completed
type: task
priority: normal
created_at: 2026-10-02T21:20:17Z
updated_at: 2026-10-04T12:52:02Z
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
- [x] `fsh-guts` declared in `special-branches.json`, with the test green (2026-10-03, branch claude/lucid-shannon-o8zop1-fsh-guts)
- [x] `cat/cat-harness/fsh-guts` exists with the contents of `fsh-guts/` (owner confirmed the push 2026-10-03; seeded 9c8828be, verified cold)
- [x] every tool listed above reads and writes through the declaration; `bun run gates` green
- [x] relocation ("delete means relocate") writes to the branch, and an end-to-end test proves it
- [x] `fsh-guts/` removed from `main` after the owner confirms
- [x] the separation partition (`instance-rules.ts`) no longer has an fsh-guts case

Related: `32f6` (cat- prefix; PR #1913), `rva2` (one storage field per special branch), `wggr` (non-instance stores), `oi3h` (fsh-guts visualiser).

_2026-10-03T00:50:36Z_ — Claimed by claude/lucid-shannon-o8zop1-fsh-guts — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## 2026-10-03: step 1, and why it was larger than one row (session https://claude.ai/code/session_01SmeBn6QZsDFaNQ4GtuC2sd)

**Sibling survey first, on the owner's instruction ("check siblings for related tooling on todos/ and beans/ move").** fsh-guts is the same shape as beans and todos: one live copy at a branch tip. Arc fs43 already builds that mechanism, so 9c7h REUSES it and builds no store of its own:
- #1764 (arc 3fva) ships `DirectoryStorageSchema` (the `storage` field on a directory declaration);
- #1937 (bean 2h76, stacked on #1764) widens `keyedBy` to `commit | tip` and adds `scripts/branch-store.ts` (tip-keyed read, splice-write, never force-push; `resolveTipLocation(id)` is what a reader asks).
- Step 3 (retarget the tools) therefore stacks on #1937, and fsh-guts becomes a declaration: `storage: { branch: "cat/cat-harness/fsh-guts", keyedBy: "tip" }` on its directory entry.

**Step 1 was blocked by stale data, not by this bean.** `special-branches.json` still declared the interim `cat-<name>` names, though bean tlk2 had already renamed `state` to `cat/cat-harness/state` and `fhir-ast` to `cat/fhir-harness/fhir-ast/`. Neither declared name existed, so `resolveBranch('state')` answered `cat-state` and a writer would have created an empty branch beside the real one. The follow-up the fs43 rename note assigned to #1928 ("update special-branches.json and its mirrors to the new names") had not happened. Done here:
- qa-reports, fhir-ast and state now carry `cat/<harness>/<name>`, with the interim `cat-<name>` kept as the first legacy name;
- beans and todos are declared (their branches existed but were undeclared: the inverse of dh4f);
- fsh-guts is declared, NOT CREATED YET;
- lake-cache keeps its name with `pendingRename`, split out to bean folio-assistant-9io2 (8 mirrors run inside folios);
- special-branches.test.ts now requires `cat/<declared harness>/`, and a pending rename must name a bean that exists. Both were mutation-checked.

**Survey re-run 2026-10-03:** 101 files mention fsh-guts, against about 30 listed above. Classification (writer, reader, excluder, declaration, test) to follow.


## Step 3 inventory, classified 2026-10-03 (101 files that mention fsh-guts)

| category | n | after the move |
|---|---|---|
| WRITER | 7 | `folio-assistant-core/scripts/sample-import-run.ts` `runSampleImport` (a HARD-CODED `join(root, 'fsh-guts', 'samples')`, so it must go through the declaration and then splice-write); `processes/library/sample-import.bpmn`, `processes/sdlc/activity-log.bpmn`, `folio-assistant-core/processes/ui/board-relocate.bpmn` (its relocate handler is not found by name; it probably resolves through the graph kind, so trace it); logs: `schemas/log-entry.ts` `logDirs`, `src/logging/log-writer.ts`, `log-sweep.ts` |
| READER | 6 | `scripts/fsh-guts-export.ts` (`fshGutsDirs`, `walk`, `buildFshGutsExport`; docs-site.yml:503), `scripts/gen-fsh-guts-viz.ts` (`gutsDir`, `gutsFiles`; CI `fsh-guts:viz:check`), `check-uploads-retired.ts` (`ARCHIVE`, `archivedSources`), `check-retired-front-matter.ts` (`scan`, record existence) |
| DECLARATION | 15 | `folio-assistant.json`'s `fsh-guts` directory entry is what every resolver-based reader and writer keys on, so it changes FIRST (it gains `storage`) |
| EXCLUDER | 3 | `.gitignore`, `bunfig.toml`, qa-utils comments: dead after the move, and harmless |
| TEST reading the real dir | 11 | fsh-guts-bean-refs, -not-rendered, -viz, -export (part), staging-only-publish, publish-verify, vocab-mapping-apply, check-retired-front-matter, retired-skill-fields, remote-packages-honest-docs, activity-log: each needs a fixture or a branch read, or it goes vacuous |
| MENTION, fixture tests, e2e ids | 59 | no change (`wireframes/fsh-guts` in derive-po and pot-extract is a DIFFERENT directory) |

**Design default, stated so it can be overruled:** `fsh-guts/logs/` is git-ignored local scratch, never committed, so it does NOT move to the branch. `logDirs` keeps resolving a local working-tree directory. Only committed content (retired/, samples/, scripts/, uploads/) moves.


## Step 2 done 2026-10-03: branch seeded (owner: "1", that is, create it now)

- `cat/cat-harness/fsh-guts` = **9c8828be799b**, an orphan commit by folio-state-bot, seeded from main@53ba9f5547a7.
- The layout is the same as `cat/cat-harness/beans`: root `manifest.json` (`state-manifest/v1`, `status: seed`, `authoritative: false`, `keyedBy: tip`, source SHA, tree id and file count), `README.md`, and `fsh-guts/**` mirroring the checkout.
- **Verified twice:** the branch's `fsh-guts` tree id equals main's (929703e0c852, 140 files), first locally before the push, then again from a cold `git init` reader (`fetch --depth=1 --filter=blob:none`, 0.84 s).
- Pushed without `-f`; the branch did not exist beforehand.
- **History:** not rewritten onto the branch. The clone was shallow, and the sibling beans and todos branches are orphan seeds too. The history stays on main, reachable from `source.sha`.
- **main is still the store.** Until the cutover, a write to main's fsh-guts/ makes the branch stale, so re-seed or splice at cutover, as the beans branch will.

## 2026-10-03: the last unknown writer, traced (no hidden code writer)

The step-3 inventory had marked `board-relocate.bpmn`'s relocate handler as unclear. Traced on main@d089aca961:
- `A_MoveContent` ("Relocate the content to the trashcan") is an AGENT task carrying skills (`board-diagram-interchange`, `deletion-requires-confirmation`). No service task and no code handler.
- No server route, script or tool writes into fsh-guts for a relocation. The grep hits are unrelated: kg-audit relocates QA sidecars, and `routes/branches.ts` "discard" is a git discard.
- The UI only READS. The dead-fish viewer fetches the published `fsh-guts.json` export. #1926's "discard to fsh-guts" is browser-local ("stickies you discarded in this browser") and never writes to the repository.

**So the complete writer list for the cutover is:** `sample-import-run.ts` (already resolved through `fshGutsDirectory`, #1945); the log writer (local scratch, stays in the working tree by design); and AGENTS following the `fsh-guts`, `deletion-requires-confirmation` and `board-diagram-interchange` skills, plus the relocate steps of `activity-log.bpmn`, `code-change-review.bpmn` and `sample-import.bpmn`. For those, step 3 is an INSTRUCTION change ("mount, move into the mount, `branch-store push`" instead of `git mv` into fsh-guts/), made once the content-source resolver from the 2026-10-03 subgraph-source ruling lands.

## 2026-10-04: the cutover (owner: "1", one cutover PR, "coordinate with Merge Manager and siblings")

- **The branch caught up first.** Main's `fsh-guts/` had grown to 147 files since the seed (140). Those 8 paths (README plus 7 new files) were spliced onto the branch with `bun run state:push` through a mount: `expect`-guarded, no force, logs excluded. The branch's `fsh-guts` tree at **9c13b434** equals main's last tree, **3750b31a**, so nothing on main is lost.
- **The declaration:** `folio-assistant.json`'s `fsh-guts` entry carries `source: { kind: "branch", branch: "cat/cat-harness/fsh-guts", keyedBy: "tip" }`. With doy3 (#1997), `tipLocations`, `state:mount` and `state:push` all find it.
- **Main stops tracking it:** 147 files removed from the index. `.gitignore` gains `/fsh-guts/**`. The `/**` matters: a directory rule `fsh-guts/` is reported for every path under it, so the `fsh-guts/logs/` rule is never seen and branch-store would push the logs. This is pinned by a test that fails under the directory rule.
- **No vacuous read:** `branch-store.contentAt(id)` returns present (via checkout or mount), not-mounted, or undeclared. The export, the visualiser, `check:uploads-retired` and `check:retired-front-matter` exit 2 ("could not determine") when the trashcan is not mounted. The sample-import trial writer refuses too. With the directory absent, 15 tests fail loudly instead of passing on nothing; with it mounted, all pass.
- **Logs do not block the first mount:** `mountTip` no longer counts checkout-ignored files as a competing copy (fixed in branch-store, with a test).
- **CI:** 13 `bun run state:mount` steps across code-quality-gates (7 jobs), docs-site, feature-staging (3) and merge-main (2). Each is a STEP_EXEMPTIONS `ci-only` setup step, and `state-mount.ts` declares `@covers none`.
- **Relocation, the agents' half:** skill `kg-core/fsh-guts` §"Where it lives" says: mount, then a plain `mv` (NOT `git mv`, which stages the ignored new path onto main; verified), then `git rm --cached` the old path, then `state:push`.
- **Partition:** `instance-rules.ts` names only CODE about fsh-guts (the visualiser, the schema), which stays. No rule partitions the directory, because it is no longer in the tree.
- **Siblings:** #1790 edits `fsh-guts/README.md` and #1898 edits the skill. I commented on both, and asked the Merge Manager to order them around this cutover. Before `ready:`, main's `fsh-guts/` is re-spliced, so anything written meanwhile carries over.


## Summary of Changes

Landed in #2057 (merge `2366227`, 2026-10-04): `fsh-guts/` lives on `cat/cat-harness/fsh-guts` and is mounted at `fsh-guts/` by `bun run state:mount`; its readers refuse with a clear error when it is not mounted; CI mounts it before every step that reads it; writes go through `bun run state:push`.

**Re-derived from the remote, 2026-10-04** (bean-coordination § "Closing a bean whose work has already landed"):
- `git ls-tree origin/main fsh-guts` → 0 entries: nothing tracked on main.
- `folio-assistant.json` on `origin/main`: fsh-guts `source` is `{kind: branch, branch: cat/cat-harness/fsh-guts, keyedBy: tip}`.
- `git ls-remote origin refs/heads/cat/cat-harness/fsh-guts` → `f54b70e`, holding 147 files under `fsh-guts/`.
- `.gitignore` carries `/fsh-guts/**` (the file-level rule, so `fsh-guts/logs/` stays ignored inside the mount).
- On a fresh worktree of `origin/main`: `bun run state:mount` → mounted, 147 files at `f54b70e85cfa`; `bun run fsh-guts:viz:check` → exit 0.
