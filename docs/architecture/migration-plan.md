---
layout: default
title: Migration plan
parent: Architecture
nav_order: 4
---

# Migration plan — one repo to five
{: .no_toc }

1. TOC
{:toc}

---

> **Status: proposed, nothing started.** This plan is the deliverable of
> [issue #223](https://github.com/litlfred/folio-assistant/issues/223). It is
> written to be argued with before any code moves.

## The governing principle

**Move wiring and script together.** Every boundary this migration creates is an
opportunity to reproduce the defect `AGENTS.md` records from qou commit
`39fc90f6`: a script deleted while its hook reference survived, or a path
computed from a script's own location that was correct before a split and wrong
after.

Bean `dh4f` is the measured cost of that defect at the *last* split: 30 scripts
triaged, 23 broken, and three of them —
[including a CI gate](current-state.html#the-failure-mode-this-repo-has-already-paid-for)
— silently passing over a corpus they could no longer read. **A green check is
the symptom, not the reassurance.**

Hence every phase gate below is a *positive* assertion (this tool read this
corpus and found this) rather than a negative one (nothing went red).

## Phase 0 — unblock, before anything moves

Phase I is described in the issue as "move code around to prepare for change".
Three things have to be true first, and none of them is a move. Skipping them
means discovering in Phase II that the target shape is unreachable.

### 0.1 — Make the dependency model able to carry the split · **blocker**

The five-repo future state composes through `dependencies.folioAssistant`. Today
that mechanism resolves **translations only**:

| resolver | external callers | needed by |
|---|---:|---|
| `resolveTranslationDirs` | 0 (the `po-resolve.ts` path is inline) | core |
| `resolveSkillDirs` | **0** | every downstream repo |
| `resolveContentDirs` | *does not exist* | every downstream repo |
| schemas from a dependency | **ruled out** by design | `folio-asst-sci`, `smart-base` |
| MCP tools from a dependency | **ruled out** by design | `folio-asst-sci`, `smart-base` |

The first three are finishing work. The last two are a **design decision that
has not been taken**: `folio-asst-sci` exists to own block kinds and
`lean_build`, and a dependency that can contribute neither can only ship prose.

*Open question for the maintainer, and the highest-value thing to settle first:*
should a dependency be able to contribute (a) block kinds, (b) an adapter, and
(c) MCP tools — and if so, how is a kind collision resolved, given
`adapterForKind` must stay
[total and unambiguous](https://github.com/litlfred/folio-assistant/blob/main/AGENTS.md)? Three shapes are worth considering:

1. **Registration at load** — a dependency exports a registration function the
   root calls. Simple; makes load order semantically significant.
2. **Manifest-declared contributions** — a dependency's `folio.config.json`
   declares the kinds and tools it adds; the root validates for collisions
   before loading anything. Fails loudly and early; more to build.
3. **Adapters stay root-only** — downstream repos ship schemas and skills, and
   any repo needing its own adapter is itself a platform. Cheapest; it makes
   `folio-asst-sci` a fork rather than a dependency, which the issue's
   "depending only on folio-asst" appears to rule out.

**Gate:** a synthetic two-repo fixture where the dependency contributes one
block kind, one skill and one MCP tool, and the root resolves all three — with a
test asserting a *kind collision is refused*, not silently overlaid.

### 0.2 — Replace the filename heuristic with a real dependency scan · **done**

`bun run check:partition` (`scripts/repo-partition.ts`) builds the import graph,
partitions it across the five proposed repos, and reports the edges crossing a
boundary in the wrong direction. Gate met: 331 modules, 655 edges, **41
wrong-direction edges** named, and **27 modules it declines to classify** rather
than guessing. Full results in
[current state](current-state.html#the-wrong-direction-edges--phase-is-worklist).

Two results change the plan below rather than merely confirming it:

- **`smart-kg` partitions to zero modules.** There is no L1 code to move, so
  that repo is new construction like the Test repos, not an extraction. It is
  re-sequenced accordingly.
- **17 of the 41 edges are `agentic-harness` → `folio-assist-core`** — the
  harness importing the content-object model, which is its defining constraint
  failing in practice. Extracting the harness is therefore *harder* than
  extracting sci, not easier, and Phase II's order reflects that.

**Remaining under 0.2:** triage the 27 unassigned platform meta-scripts
(`gen-*`, `check-*`, `render-*`). Most are probably harness; the tool does not
say so because a guessed assignment would be indistinguishable in the report
from a derived one. **41 is a floor that rises as those 27 are classified** —
classifying the test material and the MCP server already took it from 33 to 41.

### 0.3 — Decide what `folio` is

From the [issue comment](https://github.com/litlfred/folio-assistant/issues/223#issuecomment-5726628913):
top-level `content/` becomes `folio/`; **`folio` becomes its own schema which
can contain zero or more Content instances**; the left-hand navbar gets a
section per node in the folio instance.

The rename is mechanical and wide — **2,408 literal `content/` occurrences
across 429 files**. The schema is not mechanical and is the part that matters:
today `folio.config.json` has a single `contentType` and a single adapter, so
"a folio" and "a content instance" are the same object. Making a folio a
container of zero-or-more instances is a model change that touches
`adapterForKind`, the profile check, the render path and the viewer.

**Do the schema first and the rename last.** A rename lands cleanly on a settled
model; a settled model does not land cleanly on a corpus mid-rename.

## Phase I — move code to the target shape, still one repo

Everything here happens **inside** `litlfred/folio-assistant`. Nothing is
extracted. The output is a repo whose directory structure is the future state,
so Phase II can be `git filter-repo` plus a `folio.config.json` rather than
archaeology.

| # | work | gate |
|---|---|---|
| I.1 | Resolve each wrong-direction cross-edge from 0.2 — invert the dependency, move the module, or record why it is legitimate | the cross-edge list is empty or every survivor has a written reason |
| I.2 | Introduce the `folio` schema (0.3); a folio holds 0..n content instances | `content_validate` passes on a zero-instance folio **and** a two-instance folio |
| I.3 | Rename `content/` → `folio/` | no `content/` path literal survives outside intentional content-instance paths; full test suite green **and** a synthetic-folio run proves each moved tool still reads its corpus |
| I.4 | LHS navbar renders a section per node in the folio instance | a two-instance folio shows two sections; a zero-instance folio renders without error |
| I.5 | Group modules into the five target trees | each tree builds with only its declared dependencies on the path |
| I.6 | Split QA **infrastructure** (harness) from QA **criteria** (downstream) | the criterion registry loads zero criteria without erroring; criteria come from a dependency |
| I.7 | Reconcile the three `todo-manager.md` copies (`AGENTS.md` records a 188-line divergence and one copy with **no CI guard**) | one canonical copy; every other is generated and checked |

**I.3 is the one to stage carefully.** 2,408 occurrences is a scale at which a
single sweep is unreviewable. Split it by consumer — pipeline, scripts, docs,
workflows, CI — with the wiring for each moving in the same commit as its
targets.

## Phase II — separate repos, incrementally

One repo at a time, each becoming a folio-assistant instance in its own right.

**Order, cheapest-first, each proving something the next needs:**

| order | repo | proves | why here |
|---|---|---|---|
| 1 | `folio-asst-sci` | a dependency can contribute schemas, an adapter and MCP tools | hardest mechanism, cleanest boundary — 101 files that already cluster |
| 2 | `agentic-harness` | the harness genuinely does nothing on its own | extracting it *from underneath* core is how you find out what core assumed |
| 3 | `smart-base` | a dependency-of-a-dependency resolves | the depth-first walk is exercised for real |
| 4 | `smart-kg` | the L1/L2 line holds | needs WHO context; least-built today |
| 5 | `smart-kg-tools`, `smart-base-tools` | the Tool/Content kind split | only worth doing once the parents are stable |

`folio-assist-core` is never extracted: it is what remains.

**Per-repo gate — all five required:**

1. `git filter-repo` preserves history for every moved file.
2. The extracted repo builds and tests **standalone**, with its declared
   dependencies and nothing else on the path.
3. The parent, with the extraction declared as a dependency, is green.
4. **Every moved tool is run against a synthetic folio and asserted to have read
   a non-empty corpus** — the `dh4f` gate. An empty corpus exits non-zero.
5. No wiring left behind: every hook, workflow and doc reference to a moved
   script is repointed in the *same* change.

**Rollback:** until gate 3 passes, the extracted repo is additive — the parent
keeps its copy. The cutover commit is the one that deletes the parent's copy,
and it is the only commit in Phase II worth reverting as a unit.

## Phase III — build on the harness

New construction, not migration. L4/L5 Content, Tool and Test repos built off
`agentic-harness`, and healthworker- and individual-facing workflows
(immunizations is the issue's example).

The Test repos are the substantive new thing, because
[no Test repo exists today](current-state.html#what-this-repo-is-authoritative-for-today):
test data, generation templates, FHIR Test Plans, Gherkin dialects, ITB
configuration. Their defining requirement is the taxonomy's — **test data assets
are themselves folio content types in the KG** — so that SME review of test data
is the same workflow, with the same QA sidecars and the same translation path,
as review of anything else.

**Phase III is the test of whether the split worked.** If a
healthworker-facing folio has to depend on `folio-asst-sci` to get a working
install, the boundary is in the wrong place and Phase II is not finished.

## Risks

| risk | why it bites here | mitigation |
|---|---|---|
| **Silent-success scripts** | proven at the last split: 30 scripts, 23 broken, a CI gate passing over 0 blocks | every gate is a positive assertion over a synthetic folio |
| **The dependency model cannot carry it** | schemas and MCP tools are ruled out by design *today* | Phase 0.1 is a hard blocker, sequenced before any move |
| **The rename swamps review** | 2,408 occurrences across 429 files | staged by consumer; schema before rename |
| **Folio specifics leak into a split repo** | already the most-repeated defect in `AGENTS.md` | `platform-boundary-guard` subagent on every extraction; a TRAP entry per incident |
| **Boundaries drawn without domain context** | the L1/L2 line needs WHO knowledge this repo does not encode | `smart-kg` sequenced 4th; the line is drawn by a person, not inferred |
| **Five changelogs, one change** | a cross-cutting fix now needs five PRs | the ordering test: split only where consumers or cadences differ |

## What this plan does not decide

Stated plainly so the gaps are not mistaken for omissions:

- **Whether a dependency may contribute adapters and MCP tools** (0.1). The
  largest open question; `folio-asst-sci` is unbuildable until it is answered.
- **Where the L1/L2 boundary falls** between `smart-kg` and `smart-base`.
- **Whether the viewer splits by content type** or exposes a registration point
  ([future state](future-state.html#folio-assist-core)).
- **Repo ownership, naming and hosting** — org, visibility, release cadence.
- **Whether `folio-asst-sci` depends on core only**, as the issue states, or
  also needs harness surface that core does not re-export.
