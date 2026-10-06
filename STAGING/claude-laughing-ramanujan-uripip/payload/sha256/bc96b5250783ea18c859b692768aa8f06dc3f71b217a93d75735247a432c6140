---
name: sub-kg-lifecycle
description: >-
  A sub-KG is a knowledge graph staged as a directory inside a harnessed
  repository, declared as its own instance, that may later leave for a
  repository of its own. The lifecycle: declare it in place, grow it, stage it
  for separation (one import seam, the separation guard, a self-contained
  rehearsal), and then, each behind an explicit owner confirmation, create the
  repository, copy the staged contents in with history, re-point the
  declaration, verify on a fresh clone and delete the in-repo copy. Extracted
  in retrospect from the staged IG separations of 2026-09-21 to 2026-10-06
  (beans n3ni, rbz3, kg83, hcpz). The light sibling of kg-separation: use this
  for a DATA instance that leaves whole, and kg-separation when a graph must
  split into a content repository and a tools repository.
---

# Sub-KG lifecycle — staged here, separated later

> Skill id: `sub-kg-lifecycle` · Package: `graph-management`
> Process: [`sub-kg-lifecycle.bpmn`](../../../processes/kg/sub-kg-lifecycle.bpmn)

Owner, 2026-10-06: *"if user creates it in a folio/, then it can move it to
another repo later (this is essentially the create a sub-KG process and skills
we have been doing in last week … once the sub KG is staged for separation in
a repo, a new repo is created and staging contents copied into it)"*.

This skill is that week, written down. **Nothing in it was designed first.**
Every stage below is a step some session actually took, and each cites where.
Where the week did something the hard way, the stage says what to do instead.

## Which skill, this one or `kg-separation`?

| the graph | use |
|---|---|
| holds **data** — an artefact index, generated pages, a library, a folio — and leaves **whole** | **this skill** |
| holds data **and the code that writes it**, and the two must become a content repository and a tools repository | [`kg-separation`](kg-separation.md) — its fourteen stages, the pair, FR-7 |
| is not yet a graph at all — tangled into its host | [`graph-detanglement`](graph-detanglement.md) first |

The two share their gates on purpose. `Ready to seed?` here is the same
decision table, `seed-readiness-gate.dmn`, evaluated by the same command, and
the owner's confirmations here are the same rule,
[`deletion-requires-confirmation`](../../conduct/conduct-core/deletion-requires-confirmation.md).
What this skill adds is the part `kg-separation` does not cover: a sub-KG
**born** in the host, with no tools pair, that leaves in one piece.

## How a sub-KG is born — the intent question

A content type's own creation skill asks whether the new thing goes in a new
repository or inside this one, and routes here for the second answer. For a
folio in general that is [`getting-started`](../../conduct/conduct-core/getting-started.md)'s
`add-folio` branch. A harness above this one may own a creation skill for its
own kind of graph; ask `skill_list` for it rather than improvising.

**In-repository is the cheaper default** whenever the session is already in a
harnessed repository. Every stage up to 6 is reversible with `git revert`, and
nothing outside the repository changes until stage 7. A new repository is the
first irreversible, outward-facing act, and this lifecycle puts it behind a
confirmation rather than at the start.

## The stages

Each stage names its lane (a role in `cat-harness/scenarios/roles.json`) and
what decides that it is done. A stage is done when its check is green, never
when the work looks finished.

| # | stage | lane | done when | learned from |
|---|---|---|---|---|
| 0 | Brief, claim the bean | `authoring-agent` | bean claimed with `bun run beans:claim` | [`opening-brief`](../../sdlc/sdlc-core/opening-brief.md) |
| 1 | **Declare it in place** | `authoring-agent` | the declaration parses; `instance-repositories.test.ts` green | bean `6rmv` (identity), `dh4f` (declare only what exists) |
| 2 | **Grow it in place** | `authoring-agent` | the content type's own gates | the content type's skill |
| 3 | **Push generic down** | `platform-authoring-agent` | `check:import-direction`, `check:reference-direction`, `check:process-bindings` add nothing | stages A–C of `n3ni` (#1768, #1782, #1783); stage D `kg83` (#1795) |
| 4 | **One import seam** | `platform-authoring-agent` | every climb out of the directory goes through `<name>/platform.ts` | `6f19f9100` (#1767), `a93da7d41` (#1860) |
| 5 | **Rehearse self-contained** | `build-pipeline` | `bun run seed:ready --layer <name> --rehearse` | `rbz3` (fork rehearsal), `hcpz` (#1896) |
| 6 | **Report what would move** | `authoring-agent` | the report is in the bean | `kg-separation` stage 9 |
| 7 | **Owner confirms: create the repository** | `administrator` | an answer, recorded in the bean | separation arc G6 |
| 8 | Create the repository | `administrator` | it exists, empty, and was read before writing | separation arc G6/G7 |
| — | `Ready to seed?` | `build-pipeline` | `seed-readiness-gate.dmn` answers `settled` | `hcpz` |
| 9 | **Copy the staged contents in, with history** | `authoring-agent` | a reviewed PR on a branch of the new repository | `n3ni` stage E, the fork's PR #5 |
| 10 | **Re-point the declaration** | `platform-authoring-agent` | the host is green consuming the new repository | separation arc G5, S8 |
| 11 | **Verify on a fresh clone** | `build-pipeline` | the new repository's gates green from `git clone` in an empty directory | #2082, `w1gy` |
| 12 | **Owner confirms: delete the in-repo copy** | `administrator` | an answer, recorded in the bean | `n3ni` stage F, arc S8 |
| 13 | Cutover commit | `administrator` | one commit, revertable | `kg-separation` stage 13 |

### 1 · Declare it in place

A directory `<name>/` at the host's root, with `<name>/<name>.json`:

```jsonc
{
  "name": "<name>",
  "repository": "<owner>/<name>",            // the PLANNED home; IRIs key on it
  "livesAt": { "repository": "<owner>/<host>", "path": "<name>" },  // where it sits TODAY
  "version": "0.1.0",
  "needs": ["<the harness it instantiates>"],
  "directories": [ /* only directories that exist, each with its graphTypologies */ ]
}
```

- **`repository` differs from `livesAt.repository`** — that difference is
  what makes the directory a *staged* instance, and it is what the separation
  guard and `seed:ready` read. Nothing lists the staged instances by hand.
- **The directory may sit anywhere** — a root sibling is the precedent (the
  owner chose a root sibling over a nested folder on 2026-09-21), but the
  tools read `livesAt.path`, so `folio/<name>/` works the same.
- **Scaffold it with `init-folio --staged <path>`** (owner ruling 1,
  2026-10-06):

  ```sh
  bun run init-folio --staged <path> --title "<title>" \
    --repository <owner>/<name> --needs <harness>   # --host-repository when origin cannot say
  ```

  It writes exactly two files, `<path>/<name>.json` and an empty
  `<path>/platform.ts`, and nothing at the host's root;
  `init-folio-staged.test.ts` snapshots the whole host tree to hold that.
  **Never `--instance` inside a host**: it writes a repository's worth of
  scaffolding (`AGENTS.md`, `.mcp.json`, a beans store, a session hook; 15
  files, measured with `--dry-run`). `--instance` is for stage 8's repository.
- **Declare a directory with its files, in one commit** (bean `dh4f`): a
  declared-but-absent directory is scanned as empty and reported clean.

### 3 · Push generic down — before the seam, not after

The week's order was: move everything generic into the harness below
(stages A–C), consolidate what the sub-KG needs into its own harness
(stage D), and only then seed. Doing it the other way round copies generic
code into a repository that has to give it back.

Wrong-direction edges hide in **declarations and data**, not only in imports.
The separation plan found six, and no import check had caught any of them: a
skill definition naming a package one layer up, a `dependsOn`, a publication
target enumerated in an input schema, prose links, and two `needs` edges to an
empty layer. So run all three direction checks, not one.

### 4 · One import seam: `<name>/platform.ts`

Every symbol the sub-KG uses from the platform is re-exported from **one
file**, and nothing else in the directory climbs out of it. On the day it
leaves, re-pointing the platform is a one-file edit instead of a sweep.

`cat-harness/scripts/tests/instance-separation-imports.test.ts` is the guard.
It covers **every** instance whose `repository` differs from its
`livesAt.repository` — not only those that opted in, because the opt-in
version was silent in exactly the case it existed for: the one climb that
failed in the fork (`pages-markdown.test.ts`, #2082) sat in an instance with no
seam. Layers other instances build on are an explicit, checked exemption, and
an instance that still climbs has a ceiling that may only fall.

**Create the seam at stage 1, not here.** It costs one file on day one; the
week paid 25 reroutes in 10 files for one instance, then 17 more after a
single merge from `main`. A merge is where new climbs arrive, so a red guard
after one is the expected signal to reroute, not a regression.

### 5 · Rehearse self-contained — run the gates, do not scan

```sh
bun run seed:ready --layer <name> --rehearse --text   # exit 0 settled, 1 not yet, 2 unknown
```

It copies the layer and what it `needs` into a scratch workspace of sibling
directories and runs the tests there. The fork rehearsal (`rbz3`) is why
this is a run rather than a reading:

- **a static import scan found 20 of the 23 platform files** the gates
  actually loaded; the other three load at run time, one of them a JSON code
  list read by URL;
- **renaming the directory changed every generated page** (2,153 of them),
  because the URL prefix and a chrome lookup keyed on the directory name.
  The fix (`853f9532`) was to take the identity from the declaration's
  `name`, never from the path. Check for that before seeding into a
  different directory name.

### 7 and 12 · The two confirmations

Both are `userTask`s in the administrator lane, marked `relaxable="false"`,
and both follow [`deletion-requires-confirmation`](../../conduct/conduct-core/deletion-requires-confirmation.md):
the agent reports **what** would happen, **how large** it is and **how it is
undone**, then waits. Silence is not a yes. The questions are numbered, four
options at most, the recommended one first, with a stated default:

**Before stage 8:**

> `<name>` is staged and rehearses green: N files, M MB, history of K commits.
> Creating `<owner>/<name>` is visible outside this repository and is not
> undone by a revert. May it be created?
>
> 1. **Yes — you create it, and tell me when it exists** *(recommended)*
> 2. Yes — I create it *(only if this session has that permission)*
> 3. Not yet — keep it staged here
>
> **Default if you do not answer: 3.** Nothing is created.

**Before stage 13:**

> `<owner>/<name>` is green from a fresh clone and the host consumes it. The
> in-repo copy is N files. Deleting it is one commit, revertable.
>
> 1. **Delete the in-repo copy now** *(recommended)*
> 2. Keep it until the new repository's first release
> 3. Show me the file list first
>
> **Default if you do not answer: 2.** Nothing is deleted.

When the repository must be created by someone with credentials this session
lacks, the hand-over is [`agent-handoff`](../../sdlc/sdlc-core/agent-handoff.md):
one bean, one sentence for the person to relay.

### 9 · Copy the staged contents in, with history

The staged directory becomes the new repository's content **with its
history**: `git subtree split --prefix=<name>` in the host, then
`git subtree add` (or a merge of the split branch) in the new repository.
The first fork seed carried 378 commits this way. It goes in on a **branch,
as a draft PR**, never straight to `main` (separation arc S7). The new
repository's own root files — its declaration at the root, its config, its
`README` — are a second commit in the same PR, so the copy itself stays
byte-identical and reviewable.

`Ready to seed?` comes first, at seed time, because the tree has moved since
the rehearsal: every open PR touching the layer when the copy is taken is
orphaned. Its criteria and thresholds are in
[`kg-separation`](kg-separation.md) §"Ready to seed?", and not restated here.

### 10 · Re-point the declaration

| what changes | how |
|---|---|
| `livesAt` | removed in the new repository — absent means "sits at the root of `repository`" |
| the seam | `platform.ts` points at wherever the platform now is: a submodule path, or a sibling checkout |
| the host | **submodule** if the host imports code from the sub-KG; **subscription** (`kg:subscribe`) if it only reads its content (separation arc G5) |
| pins | the host pins a commit while staging, a version once released ([`upstream-version-adoption`](../../sdlc/sdlc-core/upstream-version-adoption.md)) |

The host keeps its own copy through this stage. The re-point is additive.

### 11 · Verify on a fresh clone

```sh
bun run sub-kg:verify-clone --repo <owner>/<name> --ref <seeding branch> --text   # exit 0 green, 1 red, 2 unknown
```

The Tool `sub-kg-verify-clone` (owner ruling 2, 2026-10-06) clones the new
repository into an empty scratch directory with its submodules (and each
`--sibling` beside it), installs, and runs its own `gates` script, else its
`test` script. An empty tree, a failed clone or a repository with no gate is
`unknown`, never green. **The measured falsifier**
(#2082): the first seeded fork's test failed with
`Cannot find module '../../../<harness>/…'`, because nothing in a seed runs
standalone until the seam is re-pointed. A rehearsal in the host's scratch
space is not this check; it shares the host's `node_modules` and network.

## What the week did NOT settle

The owner ruled on three questions on 2026-10-06 (bean `3tza`): *"1 2 y / 3
read only mirror in fsh-guts"*.

- **Ruled and built:** `init-folio --staged` (stage 1) and
  `sub-kg:verify-clone` (stage 11).
- **Ruled, not yet built: stage 13.** After cutover, the host is to keep a
  read-only copy in `fsh-guts` rather than delete it. [`fsh-guts`](../kg-core/fsh-guts.md)
  is the kept trashcan. It holds a one-time relocation with `movedFrom` and
  `movedOn`, is never rendered, and is stripped from every published graph.
  It has no notion of a copy refreshed from upstream. How a "mirror" maps onto
  that is asked in bean `3tza`. Until it is answered, stage 13 waits at its
  confirmation: deleting nothing is the safe state.

## Anti-patterns

1. **Creating the repository first.** It is the one irreversible step;
   everything that can be done in place is done before it.
2. **A seed with no history.** A one-commit seed severs blame for every line,
   and the history is cheap to keep.
3. **Re-pointing by sweep.** If more than one file changes when the platform
   moves, the seam was skipped.
4. **Reading the rehearsal as the fresh-clone check.** They catch different
   things: the rehearsal catches climbs, the fresh clone catches everything the
   host's environment was quietly supplying.
5. **Deleting the in-repo copy because the new repository is green.** Green
   is the precondition for asking, not the answer.
