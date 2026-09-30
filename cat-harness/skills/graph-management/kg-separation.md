---
name: kg-separation
description: >-
  Separate a Knowledge Graph into its own repository — as a CONTENT repository
  (files to read, no code) and a TOOLS repository (the code that writes and
  checks it) — once it is too large, or its consumers or cadence differ. The
  end-to-end method: the signals that trigger it, the preconditions, eleven
  stages each with the command that gates it, the owner's decision points, how
  identifiers, QA and publication move, how the parent consumes the result,
  and rollback. graph-detanglement owns stages 1–3; this skill owns the rest.
  Bootstrap + bootstrap-tools is the worked example; cat-harness +
  cat-harness-tools is next.
capability: architecture
package: graph-management
---

# Knowledge Graph separation — the method

> Skill id: `kg-separation` · Capability: `architecture` · Package: `graph-management`
> Process: [`kg-separation.bpmn`](../../processes/kg-separation.bpmn)

Owner, 2026-09-29: *"need replicable process for when KG gets too large to
handle and skills"*, and on cat-harness: *"follow same methodology/house
rules/process"*. This is that method. It was written down from what the
bootstrap separation actually did and what went wrong on the way (bean `r3gy`,
`xsqm`, and 94 separation beans surveyed), not from a plan.

[`graph-detanglement`](graph-detanglement.md) is the practice for **stages
1–3** (declare in place, detangle, isolate). Read it for those; this skill
points to it and does not restate it. Everything from "split the tools out" to
"the parent's copy is deleted" is here.

## When — the signals, and none of them alone

Separate when the graph is **too large to handle**, or when a **business
reason** separates it: *"split only where consumers or cadences differ"*. Size
is often not the reason — bootstrap is 33 files and left because its readers
and its release cadence differ from cat-harness's. Record the signals in the
bean before deciding:

| signal | how it is measured |
|---|---|
| files and bytes per instance | `git ls-files \| cut -d/ -f1 \| sort \| uniq -c` |
| clone cost | `bun run health` → `repository-size` |
| gate time a content change pays | `bun run gates` (the gate count and wall time) |
| merge contention | commits per day on `main`; PRs re-conflicted before merge |
| cohesion and cut of the candidate | `bun run kg:detangle` |
| wrong-direction edges | `check:partition`, `kg:detangle:check`, `check:reference-direction` |
| what the tools would drag along | the import cone of the would-be tools package (`check:tools-closure` once it exists) |

## Preconditions — each was learned from a failure

1. **Names agree before the cut** — directory, declared `name`, package name.
   A rename after the cut is a cross-repository change.
2. **One directory per instance**, so extraction is one move, not a sift.
3. **Every gate that guards the boundary has been watched failing** — plant a
   violation, see it red, remove it. Four boundary gates in this repository
   passed while guarding nothing (`4j3h` could not fail, `q2wn` could not see
   side-effect imports, `p11x` could not see across instances, `ymsu` was
   repaired before it ran).
4. **The owner's decisions are recorded in the bean** (the table below).
5. **"Generated output is the contract" is written down** (`319n`): what
   crosses the boundary is the generated file, and any tool may produce it.

## The pair: a content repository and a tools repository

A separated Knowledge Graph is two repositories, not one.

| | content (`<name>`) | tools (`<name>-tools`) |
|---|---|---|
| holds | files to read — `.md`, `.json`, `.bpmn`, generated schemas, READMEs, diagrams | the code that writes and checks the content — Zod sources, generators, README/diagram writers, content checks |
| code | **none** (FR-7 — a reader needs nothing installed) | yes, with a declared, minimal dependency set |
| depends on | nothing | the content, and nothing above it — `check:tools-closure` |
| is used by | the parent harness, pinned | the content's own checks, and the parent (a package) |

Owner rulings that make the pattern (2026-09-29, bean `xsqm`):

- **The Zod source moves DOWN into the tools repository** — not up into the
  harness. Zod in the harness makes a content release wait on the harness,
  which itself needs the content: a cycle.
- **The tools repository owns the content checks AND the README and diagram
  writers** — one copy, which the parent harness also calls. It is **not** a
  second harness: a content Knowledge Graph declares no visualisers. It is one
  toolset over swappable content — *"someone wants a different visualizer they
  can use different toolset"*.
- **Every tool is a script an agent runs as the actor in a process step.**
  Agentic first. A GitHub Actions workflow may be **described, but ships
  disabled**, and nothing that costs money runs unless the owner asks.
- **Harness output ABOUT the content stays with the harness** (hosted): its
  QA verdicts (`kgQaHomeFor`), translation templates (`translationsHomeFor`),
  exported graph and glossary ledger. The content repository carries only
  what its own checks need.

## The stages

Each stage names its lane (a role in `cat-harness/scenarios/roles.json`) and
the command that gates it. A stage is done when its gate is green, never when
the work looks finished.

| # | stage | lane | gate |
|---|---|---|---|
| 0 | Brief, measure the signals, claim | `authoring-agent` | signals in the bean; `bun run beans:claim <id>` |
| 1–3 | Declare in place, detangle, isolate | `authoring-agent` | [`graph-detanglement`](graph-detanglement.md) — all its gates |
| 4 | **Identity**: `name`, `version`, `iriBase`, `needs`, `nodeSchemas` in the declaration; move the base once | `platform-authoring-agent` | `iri:sync -- --from <old base>` then `iri:sync:check`; `check:node-iris` |
| 5 | **Hosted outputs out** of the content | `platform-authoring-agent` | the content leak test's pending list is empty |
| 6 | **Split content from tools**: create `<name>-tools/` as a sibling, move the code, cut its import cone | `platform-authoring-agent` | FR-7 (content holds no code); `check:tools-closure`; generated files byte-identical before and after |
| 7 | **Publication plan**: every identifier the content mints is a file some step publishes, at `/<version>/` and `/v<major>/` | `publication-manager` | `check:node-iris`; the site layout in [`instance-publication`](../folio-core/instance-publication.md) §"The release site" |
| 8 | **Rehearse standalone**: copy content + tools alone into a temporary directory and run the tools' checks there | `build-pipeline` | green with nothing else on the path; an empty tree exits non-zero |
| 9 | **Authorise** — report what moves, sizes, what breaks, and wait | `administrator` | the owner's answer ([`deletion-requires-confirmation`](../folio-core/deletion-requires-confirmation.md)) |
| 10 | **Seed**: the owner creates the repositories; seed `main`, then the content and tools as reviewed PRs, with history | `administrator`, then `authoring-agent` | the seeding PRs reviewed and green |
| 11 | **Parent consumes, additively**: pin (a SHA while staging, a version once released), repoint imports, keep the parent's copy | `platform-authoring-agent` | the parent green with the dependency declared; `check:published-refs` |
| 12 | **First release**: tag, publish `/<version>/` and `/v<major>/` | `publication-manager` | `check:version-bump`; every identifier dereferences ([`publish-verification`](../folio-core/publish-verification.md)) |
| 13 | **Cutover**: the one commit deleting the parent's copy | `administrator` | only after 11 and 12 are green |
| 14 | **Independent refinement**: each new release adopted by the parent as a reviewed step | `authoring-agent` | [`upstream-version-adoption`](../folio-core/upstream-version-adoption.md) |

**Nothing is committed to the new repositories before stage 10**, and stage 10
starts only when the owner says so. Until then the pair is staged as sibling
directories in the parent (`bootstrap/`, `bootstrap-tools/`).

## The owner's decisions

An agent asks these; it does not settle them.

1. Separate at all, and where the boundary is — after the signals are measured.
2. The address base for the extracted graph's identifiers: under the parent, or
   the new repository's own.
3. Where verdicts about it live: hosted in the harness, or in the content.
4. What the tools repository owns, and how its checks run (agent, package,
   described workflow).
5. Authorise the extraction (stage 9).
6. Whether the first release is a draft with a tag, or the first formal
   publication ([`instance-publication`](../folio-core/instance-publication.md)).
7. The cutover (stage 13).

## Identifiers and versions

One `iriBase` and one `version` in the declaration. Identifiers a program reads
are `<iriBase><version>/…`; pages a person reads are `<iriBase>v<major>/…`
(`bootstrap-tools/schemas/release-iri.ts`). A base move is
`bun run iri:sync -- --from <old base>`, once. A `$schema` tag carries its
schema's own semver. The exported graph's own `@id` moves only when the new
repository actually publishes (`40fl`). A published node's identifier must be
its file's path (`check:node-iris`).

## Versions of the pair — same scheme, same start, then independent

Owner, 2026-09-29: *"on creation of new repo/staging dir, they use the same
SEMVER for simplicity at time of split. then they are managed independently.
some tools may be able to manage several different versions / ranges of
versions of the content."*

- **At the split, both start at the content's current version** — bootstrap
  was `0.1.0`, so bootstrap-tools starts at `0.1.0`.
- **After that each is versioned on its own**, by the same rules: semver, the
  bump computed from the exported surface (`check:version-bump`), tags
  `<name>-v<major>.<minor>.<patch>`.
- **A tools release says which content versions it handles** as a list of
  supported MAJOR versions (`bootstrap: [0]`), never a range expression —
  `instance-versioning` rule 2 forbids range syntax, and within one major a
  newer minor or patch only adds (`tagCompatible`). A tool asked to work on a
  content major it does not list refuses rather than guesses.

## How the parent consumes the pair

| mechanism | when |
|---|---|
| git submodule at a SHA, at the same path | staging — the parent reads the content's files |
| a package at an exact version | published — the parent imports the tools' Zod and writers |
| an `upstream-pins.json` entry, moved by `upstream-version-adoption.bpmn` | every new release |

The parent's own literal copies of the content's identifiers are kept in step
against the **pinned** version, not the latest.

## Rollback

Until the parent is green with the extraction declared, the extraction is
additive and the parent keeps its copy; the cutover commit is the one unit
worth reverting. After a release, a tagged version is never reused: roll back
with a new patch release and move the parent's pin back.

## Worked example — bootstrap + bootstrap-tools

- Stages 1–5: bean `r3gy` groups A–E (#1486, #1503) — wrong facts, folio-only
  names, root-relative paths, graph kinds and `$schema` tags and QA out, IRIs
  under `https://litlfred.github.io/bootstrap/` with semver.
- Stage 6: bean `xsqm` — `bootstrap-tools/` re-created as a sibling; the Zod
  source moved down; import cone from 19 files / 11,577 lines to 12 / 2,249,
  `zod` only; `check:tools-closure` and `check:node-iris` added, each watched
  failing on a planted violation.
- Next: the README and diagram writers join bootstrap-tools; the publication
  plan; the standalone rehearsal; then the owner's authorisation.

cat-harness + cat-harness-tools follows the same stages.
