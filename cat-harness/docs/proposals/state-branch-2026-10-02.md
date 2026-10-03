---
title: "State graphs on a declared branch"
kind: proposal
summary: >-
  Proposed 2026-10-02: move process-written STATE graphs (beans, workflow
  instances, todos, issue-marks, health) off main onto one declared `state`
  branch, and make "which ref holds this graph" a declared property of every
  graph — generalising the qa-reports arc (3fva) rather than competing with it.
---

# State graphs on a declared branch
{: .no_toc }

**Status:** proposal; D1–D4 ruled 2026-10-02, all defaults (§6), **and D4 amended
2026-10-03 to option (b), a branch per graph** — see the amendment under the D4
row. **Nothing has moved yet.** Epic bean
`folio-assistant-fs43`. Generalises arc `3fva` (issue
[#1763](https://github.com/litlfred/folio-assistant/issues/1763), PRs
[#1764](https://github.com/litlfred/folio-assistant/pull/1764) and
[#1801](https://github.com/litlfred/folio-assistant/pull/1801)), which moves QA
evidence to an orphan `qa-reports` branch.

1. TOC
{:toc}

---

## 1. The ask

Owner, 2026-10-02:

> just like there are special branches (gh-pages, qa-reports, lean and fhir-ast
> caches) we should have a special branch for state based KG content (e.g.
> todos and beans). and that this branch would be a declared sub-graph. what
> would need to change? develop workplan. this should be a general practice to
> manage a KG and generated content (and that rendered content is
> sub-graph/linking to primary semi-static content graph). review processes
> and adjust

Three things are asked, and they are separable:

1. **A `state` branch** for the process-written graphs.
2. **"Which ref holds this graph" becomes a declaration**, so the branch is a
   declared sub-graph rather than a convention a script knows about.
3. **A general rule**: content on `main`; everything a process writes or
   regenerates on a declared ref, as a sub-graph that *links back* to the
   primary content graph at a commit.

## 2. What exists today (measured 2026-10-02 at `b3088cd`)

### 2.1 The special branches

| branch | writer | write shape | declared as a graph? |
|---|---|---|---|
| `gh-pages` | `docs-site.yml` (full replace), `feature-staging.yml` (`STAGING/<slug>/`), `discoverability-docs.yml` | replace / keep_files | **no** — a `branch:` string in `schemas/staging-preview.ts` |
| `lake-cache/<pkg>-<slug>` | `lake-cache-refresh.yml` via `lake-cache.sh seed --push` | orphan, one key per branch, pruned by deletion | **no** — inferred by name prefix |
| `qa-reports` | `folio-qa-bot` (arc `3fva`, not on `main` yet) | orphan, commit-keyed, append, never `-f` | **proposed** — a `storage` field on `ContentDirectory` (3fva §2.4) |

There is no witness, LaTeX or fhir-ast cache *branch* today; those caches are
Actions caches or `build/`. **No declaration field anywhere places a graph on
another git ref** — every `ref` in the schemas is a SHA of another repo, a
dependency ref, or a page path.

### 2.2 The state graphs on `main`

Kinds whose `holds` is `state` (`graph-kind-registry.ts`), and where the
directories declaring them live:

| graph | path | declared in |
|---|---|---|
| bean defs (+ archive) | `beans/defs/` | `beans/beans.json`, `folio-assistant.json` |
| workflow instances | `beans/workflows/` | `beans/beans.json` |
| session surveys | `beans/surveys/` | `beans/beans.json` |
| todos | `todos/` | `folio-assistant.json` |
| issue marks | `issue-marks/` | `folio-assistant.json` |
| health results | `test/health/results/` | `cat-harness/cat-harness.json` |
| qa | `test/results/` | four instances — **already arc 3fva's** |
| uploads, swimlane glossary | `uploads/`, `glossary/` | see §3.3 — **not** proposed to move |

### 2.3 What it costs

- **Merge friction.** Bean `y7b3` replayed 300 main-into-branch merges: 235
  conflicted, 147 (63 %) *only* on generated files, and `beans/README.md` alone
  accounted for 76 — every one on its file-count line. Bean `cflw`: one auditor
  edit rewrote 218 sidecars.
- **Claims are branch-local.** `bean-coordination` §"A claim is branch-local":
  a claim announces rather than reserves until the PR exists, and 97 of 100
  `in-progress` beans on `main` recorded no holder (bean `c3d7`).
  `beans:claim` works around this by **pushing a claim commit straight to
  `main`** from a detached worktree — the one script that treats `main` as a
  shared database.
- **Every bean edit is a `main` commit**, so it re-triggers the docs site, the
  gate set and every PR's "behind main" count for a change to no code.

## 3. Design

### 3.1 The general rule — content on `main`, everything else on a declared ref

The layer a kind already declares (`holds`) decides where its graph lives by
default. The declaration makes it explicit and checkable.

| layer (`holds`) | example | default ref | keyed by | write shape |
|---|---|---|---|---|
| `content` | chapters, skills, processes | `main` | — | PR |
| `context` | interaction prefs, roles | `main` | — | PR |
| `state` | beans, workflow instances, todos | **`state`** | **tip** — one living tree | fetch → splice → push, never `-f` |
| `derived` (verdicts) | QA sidecars | `qa-reports` (3fva) | commit | append under `main/<sha>/`, `pr/<n>/<sha>/` |
| rendered | the docs site | `gh-pages` | commit (the build stamp) | replace, previews kept |
| cache | Lake builds | `lake-cache/*` | toolchain + inputs | one key per branch, pruned |

The distinction that matters between `state` and `derived`: **state is not
regenerable**. A QA verdict can be recomputed from the tree, so a
commit-keyed snapshot per run is right and losing one costs a rerun. A bean is
somebody's decision; it must be a single living tree whose history is the
audit trail, and a lost write is lost work. So `state` is tip-keyed and its
write loop must splice, never replace.

### 3.2 The declaration — one field, shared with 3fva

Arc 3fva proposes `storage` on `ContentDirectory`. This proposal **reuses that
field** rather than adding a second one, and widens its key.

**One ref per state subgraph, not one shared `state` branch.** The owner,
2026-10-02, verbatim:

> "go with cat/cat-harness/todos and cat/cat-harness/beans as their own named sub-graph branches"
>
> "(not all named subgraphs get own branch, especially not semi-static KG content)"
>
> "once beans. moves over, neeed to move active beans and update tools"
>
> "keep workong. fix gaps"

So the intended declarations (bean `2h76`) are:

```jsonc
// folio-assistant.json (the root instance declares both) — beans, one live copy at the tip of its own branch
{ "id": "beans", "path": "beans/", "graphKinds": ["beans"],
  "storage": { "branch": "cat/cat-harness/beans", "keyedBy": "tip" } }

// todos — likewise
{ "id": "todos", "path": "todos/", "graphKinds": ["todos"],
  "storage": { "branch": "cat/cat-harness/todos", "keyedBy": "tip" } }

// test/results — 3fva, unchanged
{ "id": "qa", "path": "test/results", "graphKinds": ["qa"],
  "storage": { "branch": "cat/cat-harness/qa-reports", "keyedBy": "commit" } }
```

**Not declared yet, on purpose.** `DirectoryStorageSchema.keyedBy` accepts
`"tip"` as of the `claude/state-branch-store` PR (stacked on #1764), and `branch-store.ts` exists, but no
declaration sets `storage` on beans or todos and no reader or writer changed.
**`main` stays authoritative** until the steward-run flip on #1850, which is
then a one-line change per directory: add the `storage` member shown above.

- `keyedBy: "tip"` (one live copy — state) or `"commit"` (one entry per commit
  — derived, rendered). A `qa` directory refuses `"tip"`: its readers compare a
  commit against a baseline, and `qa-store.ts` implements only that layout.
- **Semi-static KG content stays on `main`.** Skills, schemas, processes, roles
  and the declarations themselves change by PR and are reviewed as content; a
  branch of their own would take them out of review. Only process-written
  state gets a ref, and not even all of that: the owner's "(not all named
  subgraphs get own branch)".
- **Every node written to a non-`main` ref carries a back-link** —
  `{ "source": { "ref": "main", "sha": "<commit>" } }` in the branch's manifest
  — to the content commit it describes. That is the owner's "rendered content
  is a sub-graph linking to the primary content graph", made a field. The
  deploy's `build.json` (bean `r6es`, this PR) is the first instance: the docs
  site now says which `main` commit it is a rendering of, and how far behind.
- `within` (already on `GraphKindDef`) names the primary graph a sub-graph
  belongs to. `gh-pages` gets a declaration for the first time, `within` the
  `folio` graph it renders.
- `folio_init` writes the same declarations, so a folio inherits the layout.

### 3.3 What moves and what stays

| class | moves | why |
|---|---|---|
| `beans/defs/`, `beans/defs/archive/`, `beans/workflows/`, `beans/surveys/` | **yes** | process-written; co-located per the 2026-09-18 ruling (`workflow-state-in-beans.md` Option A) — they move *together* |
| `todos/`, `issue-marks/` | **yes** | process-written |
| `test/health/results/` | **yes** | already uploaded as an artifact, not committed by CI |
| `beans/beans.json`, `.beans.yml` | **stay** | they are the *declaration*, which is content |
| `beans/README.md` | **removed from `main`** | its count line is the top `y7b3` churner; the branch's own README replaces it |
| `uploads/` | **no** | a person's file is authored input, not process output; `state` only by the "a process writes it" test — D1 |
| `glossary/` | **no** | rendered from content; regenerable — a `derived` candidate, not `state` |
| `interaction/` | **no** | `context` — read at session start, never written by a process |

### 3.4 How it is read and written

The mechanism is 3fva's, proven by its spike `3ds9` (CI push, fresh container
push, two concurrent disjoint writers both surviving, cold read latency).

- **One tip-keyed library; qa-store keeps its own for now.**
  `cat-harness/scripts/branch-store.ts` (bean `2h76`) is generic over any
  declared directory whose `storage.keyedBy` is `"tip"`:
  `BranchStore.open(branch | candidates[])`, then `readFile` / `readJson` /
  `listDir` / `readTree` and `write(changes, message)`. Reads answer
  **hit / miss / corrupt / unknown**, the same four states as qa-store, and a
  branch without a `state-manifest/v1` root manifest with `keyedBy: "tip"` is
  `corrupt`, never a hit. Write = fetch tip → `hash-object` → `mktree` splice
  onto the *new* tip (every other file carried across by id) →
  `commit-tree -p tip` → push; on a rejected push, refetch and splice again,
  up to 3 attempts with `backoff-sleep.ts`, **never `-f`**. A change may carry
  `expect` (the blob id its author read). If the tip disagrees, the result is
  `conflict` and nothing is pushed. That is what makes "two sessions edit the
  same bean" detectable rather than last-writer-wins. The library never
  creates a branch: seeding one carries the manifest and is a steward act.
  `qa-store.ts` has the same loop for commit-keyed entries. Whether it adopts
  `branch-store.ts` is arc 3fva's call, and a later bean.
- **Layout: paths mirror the checkout.** The seeds `cat/cat-harness/beans` @
  `b3709ad` and `cat/cat-harness/todos` @ `7ad5854` are orphans. Each holds
  `README.md`, `manifest.json` (`state-manifest/v1`, `keyedBy: "tip"`,
  `authoritative: false`) and the subgraph at the same path as on `main`
  (`beans/**`, `todos/**`).
- **A working mount for tools that need a directory.** The `beans` CLI is
  third-party and reads `beans/defs` off disk. The session-start hook mounts the
  `state` branch as a git worktree at `state/` (ignored on `main`), and
  `.beans.yml` points at `state/beans/defs`. `beans` then behaves exactly as
  today; `bun run state:push` commits and pushes the worktree through the
  library.
- **A claim becomes global the moment it is written.** `beans:claim` already
  pushes to `main`; it pushes to `state` instead. §"A claim is branch-local" in
  `bean-coordination` stops being true — the largest single gain.
- **Pinning to a code commit.** A PR that closes a bean says so in its body
  (`Closes-bean: <id>`); `merge-main.yml`'s post-merge job transitions the bean
  on `state` with `source.sha` = the merge commit. Code and bean are no longer
  one commit, so the link is a field rather than co-location.

### 3.5 What a gate becomes

The nine bean gates (`check:bean-parents`, `bean-blocks`, `bean-rollup`,
`bean-bodies`, `bean-front-matter`, `bean-issue-links`, …) stop running on code
PRs that touch no bean and run **on push to `state`** instead, as a required
check on that branch's own workflow. A gate that cannot fetch the branch
reports `unknown`, never a pass — the same rule as 3fva §2.3.

## 4. What would need to change

Inventory, every reader and writer found (Explore sweep, 2026-10-02):

| area | file | change |
|---|---|---|
| schema | `schemas/cat-harness.ts` (`DirectoryStorageSchema`, from #1764), `schemas/bean-graph.ts` | widen `keyedBy` to `commit \| tip` — **shared with 3fva**; no new field |
| schema | `graph-kind-registry.ts` | `holds: state` ⇒ default `storage.keyedBy: tip`; a check that a declared `state` dir on `main` is a finding once migrated |
| beans CLI | `.beans.yml` | `path: state/beans/defs` |
| engine | `cat-harness/src/workflow/store.ts` `WORKFLOW_DIR` | resolve from the declaration, not a constant |
| claim | `cat-harness/scripts/claim-bean.ts` | push to `state`, not `main` |
| fallback | `cat-harness/scripts/beans-fallback.ts` | read the mount; fix its stale `beans/*.md` header |
| landed | `cat-harness/scripts/beans-landed.ts` | read `Closes-bean:` from merges |
| session start | `.claude/settings.json` hook, `session-start-coord-sweep.sh` | fetch + mount `state/`; report "could not mount" as a finding |
| site | `gen-docs-pages.ts` (`assets/beans/index.json`), `state-visualizer.ts` | read from the branch at build; `docs-site.yml` also triggers on push to `state` |
| gates | `code-quality-gates.yml` (9 bean gates, `check:harness-dirs`, `check:harness-state`, `kg:audit`, `audit:coverage`) | read `storage`; bean gates move to a `state`-branch workflow |
| health | `test/health/run.ts` | write results through the library |
| todos | `scripts/todos.ts`, `render-pipeline.ts` | write through the library |
| issue marks | `scan-repo-content.ts`, `merge-conflict-patterns.ts`, `harness-tiles.ts` | read through the library |
| scaffold | `folio_init` templates | write the declarations and the hook |
| docs | `AGENTS.md` (beans section), onboarding guide | pointers only |

### 4.1 Skills and processes to adjust

These change **after** the decisions in §6, not before — a skill that describes
a branch that does not exist yet is a rule nobody can follow.

| skill / process | adjustment |
|---|---|
| `kg-core/content-context-and-state-graphs` | add §"Where each layer lives" — the table in §3.1 |
| `kg-core/directory-conventions` | the `storage` field; "a graph on another ref is still a declared directory" |
| `sdlc-core/todo-manager` | the mount; `state:push`; "WHEN COMMITTING include bean files" becomes "push the state worktree" |
| `sdlc-core/bean-coordination` | retire §"A claim is branch-local"; `Closes-bean:` replaces co-located commits |
| `sdlc-core/continual-progress` | a bean edit is no longer part of the PR's commit set |
| `process/workflow/workflow-state`, `process-state` | instances live on `state`; "no instance recorded" reads the branch |
| `processes/*.bpmn` with `<cat-harness.processes:bean op>` | the engine's bean op writes through the library — diagrams unchanged |
| `proposals/workflow-state-in-beans.md` | §0 addendum: Option A's co-location is kept; only the ref moves |

## 5. Workplan

Phases are serial; items inside a phase can run in parallel (⇉).

**Phase 0 — align with 3fva (now).** Agree one `storage` field and one
`branch-store` library with arc 3fva's owner session before either lands. A
second field over the same question is two answers free to disagree.

*Found 2026-10-02 on #1764's branch:* 3fva already ships
`DirectoryStorageSchema = { branch, keyedBy: z.literal("commit") }.strict()`
and `scripts/qa-store.ts`, whose private `Store` class (private bare repo,
`fetchTip`, `setPath` splice, retry on a moved tip, never `-f`) is the generic
half. The proposed agreement (posted on #1764) asks nothing of that PR: it lands
as is, and Phase 2 then (a) extracts `Store` into `branch-store.ts`, which
`qa-store` imports, and (b) widens `keyedBy` to `z.enum(["commit", "tip"])`.
**No `path` field:** like `qa-store`, the state branch mirrors the checkout's
paths (`beans/defs/…` on `state` is `beans/defs/…` in the tree), so the
declared `path` already says where a file lives on either side.

**Phase 1 — decisions (owner).** §6, D1–D4.

**Phase 2 — mechanism (serial, one agent).**
2.1 `storage` in the schema, with `keyedBy: tip`. 2.2 `branch-store.ts`
(read, splice-write, retry, never `-f`) — shared with 3fva's `qa:fetch`.
2.3 Seed the `state` orphan branch from `main`'s current `beans/`, `todos/`,
`issue-marks/` with a hash-verified manifest. 2.4 the session-start mount and
`state:push`.

**Phase 3 — migrate readers and writers (⇉ per row of §4).** Each row is one
bean, each green against the branch before the next phase.

**Phase 4 — gates (⇉).** The bean gates move to a `state`-branch workflow;
`check:harness-dirs`, `audit:coverage`, `kg:audit` read `storage`.

**Phase 5 — skills, processes, docs (⇉ after Phase 3).** §4.1.

**Phase 6 — remove from `main`, on the owner's explicit go only**
(`deletion-requires-confirmation`). Not before every reader is green.

**Phase 7 — the general practice.** Declare `gh-pages` (`within: folio`,
`keyedBy: commit`, back-link = `build.json`) and `lake-cache/*` (`keyedBy:
inputs`) with the same field, so every special branch is a declared sub-graph
and `audit:coverage` can see all of them.

## 6. Decisions for the owner

> **Ruled by the owner, 2026-10-02:** *"go with defaults for D1-D4"* —
> **D1 (a)**, **D2 (a)**, **D3 (a)**, **D4 (a)**. The options are kept below
> as the record of what was weighed.

Recommended option first. **The default applies if no answer comes, and the
work proceeds on it.**

- **D1. What moves.** (a) **beans (defs, archive, workflows, surveys), todos,
  issue-marks, health results (recommended)**; (b) beans only, as a pilot;
  (c) (a) plus `uploads/`. *Default: (a).*
- **D2. How an agent session writes to `state`.** Cloud sessions are told to
  push only to their own branch. (a) **direct push to `state` through the
  library, falling back to carrying the edit on the PR branch when the push is
  refused (recommended)** — `beans:claim` already has this `fell-back` state;
  (b) always carry edits on the PR branch, applied to `state` by a post-merge
  workflow — no new permission, but claims stay branch-local; (c) direct push
  only. *Default: (a).*
- **D3. Relation to arc 3fva.** (a) **one `storage` field and one library,
  agreed with 3fva before either lands (recommended)**; (b) land 3fva as is
  and widen it here afterwards; (c) independent mechanisms. *Default: (a).*
- **D4. One branch or several.** (a) **one `state` branch, graphs as
  directories inside it (recommended)** — one fetch, one mount, one gate
  workflow; (b) one branch per graph (`state/beans`, `state/todos`) — finer
  retention, more mounts. *Default: (a).*

  > **Amended by the owner, 2026-10-03 — D4 is now option (b).** *"Keep
  > per-graph branches"*, and the principle behind it: *"i dont think we need
  > a speciifc "state" branch or mount, several potnential subgraphs can be a
  > part of state"*.
  >
  > This reverses the 2026-10-02 ruling on **D4 only**. D1, D2 and D3 are
  > unchanged — beans, workflow instances, todos, issue-marks and health
  > results all still move; only their DESTINATION changed, from directories
  > inside one `state` branch to a `cat/<harness>/<name>` branch each. The
  > "more mounts" cost named in option (b) is what bean `2h76`'s fan-out pays:
  > `state:mount` and `state:push` iterate the declared tip-keyed directories
  > and mount or splice each from the branch its own declaration names, so
  > "one mount" was never load-bearing — "one fetch" is still true per graph.
  >
  > `cat/cat-harness/state`, seeded under option (a), is **superseded rather
  > than deleted**: retiring that name is bean `oycs`, and nothing here
  > removes it (`deletion-requires-confirmation`).
  >
  > The ruling, with its measurements, is the bean note
  > `beans/notes/folio-assistant-2h76--2026-10-03--claude-festive-galileo-s7ibx0.md`.
  > The options above are kept as the record of what was weighed.

## 7. What would falsify this

- **The mount is not there when an agent needs it.** If the session-start
  hook's fetch fails silently and `beans list` returns empty, the agent reads
  "no work" — the third state collapsing into zero. The hook must fail loudly,
  and `beans-fallback` must refuse rather than read an empty directory.
- **Concurrent writers lose a bean edit.** 3fva's spike showed disjoint paths
  survive; two sessions editing the **same** bean is the new case and must be
  measured before Phase 6. A lost edit is a falsifier, not a tuning issue.
- **A reader is found that needs the bean beside the code in one commit** —
  e.g. a review that must see the bean transition in the PR diff. Then D2 (b)
  for that case, and §3.4's `Closes-bean:` gains a rendered view on the PR.

## 8. Not in scope

- Changing what a bean or a workflow instance *contains*.
- The QA move itself — that is arc 3fva; this proposal only shares its field
  and library.
- Merge queue / require-up-to-date (`1hjm`, `kgho`).
