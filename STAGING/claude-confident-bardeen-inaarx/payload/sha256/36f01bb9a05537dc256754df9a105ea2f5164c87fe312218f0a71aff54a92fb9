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
---

# Knowledge Graph separation — the method

> Skill id: `kg-separation` · Package: `graph-management`
> Process: [`kg-separation.bpmn`](../../../processes/kg/kg-separation.bpmn)

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
| wrong-direction edges **within one instance** — modules bucketed into the proposed repos by path rule | `check:partition` (its root is ONE instance; read the scope it prints) |
| wrong-direction edges **between instances** — checked against each one's declared `needs` | `bun run kg:detangle:direction`, blocking in CI (bean `p11x`) |
| wrong-direction **references** — the prose axis, not the import axis | `check:reference-direction` |
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

### Staged content with no tools repository yet — the finding, not the silence

An instance can be planned as a content repository before its `-tools` pair
is authorised (who-iris, 2026-09-30). Declare it — `separation: "content"` in
`<name>.json`; the content half of an existing pair is read from the tools
instance's `supports` and needs nothing — and kg:audit's
`content-instance-holds-code` records a finding naming every code file still
inside it. It is a `minor` QA **warning**, not a failure, by owner ruling
(2026-10-01: *"QA warning. not failure.. ok b/c small # tools"*): the owner
tolerates the code *for now* (*"iris specific tools for now ok in who-iris/"*),
and the warrant is that the tolerated set is small. It was `major` until then,
on the argument that FR-7 has no legitimate exceptions. A warning still names
each file, so the violation is never silent. The remedy splits by what
the code is: **generic** code (it works for any instance of its kind — any
DSpace catalogue, any PDF) moves into the platform and takes the instance root
as an argument; **instance-specific** code waits for `<name>-tools`. Bean
`eayu`.

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
| 7 | **Publication plan**: every identifier the content mints is a file some step publishes, at `/<version>/` and `/v<major>/` | `publication-manager` | `check:node-iris`; the site layout in [`instance-publication`](../kg-core/instance-publication.md) §"The release site" |
| 8 | **Rehearse standalone**: copy content + tools alone into a temporary directory and run the tools' checks there | `build-pipeline` | green with nothing else on the path; an empty tree exits non-zero |
| 9 | **Authorise** — report what moves, sizes, what breaks, and wait | `administrator` | the owner's answer ([`deletion-requires-confirmation`](../../conduct/conduct-core/deletion-requires-confirmation.md)) |
| 10 | **Seed**: the owner creates the repositories; once the source has settled, seed `main`, then the content and tools as reviewed PRs, with history | `administrator`, then `authoring-agent` | `bun run seed:ready --layer <name> --rehearse` answers `settled` for each layer, at seed time; then the seeding PRs reviewed and green |
| 11 | **Parent consumes, additively**: pin (a SHA while staging, a version once released), repoint imports, keep the parent's copy | `platform-authoring-agent` | the parent green with the dependency declared; `check:published-refs` |
| 12 | **First release**: tag, publish `/<version>/` and `/v<major>/` | `publication-manager` | `check:version-bump`; every identifier dereferences ([`publish-verification`](../../sdlc/sdlc-core/publish-verification.md)) |
| 13 | **Cutover**: the one commit deleting the parent's copy | `administrator` | only after 11 and 12 are green |
| 14 | **Independent refinement**: each new release adopted by the parent as a reviewed step | `authoring-agent` | [`upstream-version-adoption`](../../sdlc/sdlc-core/upstream-version-adoption.md) |

**Nothing is committed to the new repositories before stage 10**, and stage 10
starts only when the owner says so. Until then the pair is staged as sibling
directories in the parent (`bootstrap/`, `bootstrap-tools/`).

### Ready to seed? — asked at seed time, not at rehearsal

A seed is a snapshot: one commit that names the source sha, with no history
(bean `iai8`). **Every open PR whose diff touches the layer when the snapshot
is taken is orphaned into the monorepo**: after cutover its change is in
neither the seed nor anywhere that reads it. Stage 8 asked whether the layer
stands alone, but the tree has moved since. So `GW_SeedReady` sits between
creating the repositories and seeding them, and asks again:

```sh
bun run seed:ready --layer cat-harness --rehearse --text   # exit 0 settled, 1 not yet, 2 unknown
```

| criterion | `not yet` when |
|---|---|
| heavy movers | an open PR labelled `heavy-mover` touches the layer or the next one up |
| next layer | any open PR touches the next layer up, which imports this one |
| layer load | more than five open PRs touch the layer |
| moves | an open PR deletes a file in the layer, or renames one into or out of it |
| standalone | `bun test` is red with only the layer and what it `needs` beside it, as sibling directories |
| upward paths | a path DECLARED in the layer — a Tool module, a QA criterion source, a render target — resolves only in an instance above it, so it breaks the day the layer stands alone |

These were the steward's hand-applied criteria (2026-10-02), generalised per
layer.

**`upward paths` replaced `sibling discovery` (owner, 2026-10-04).** The old
criterion counted dependents that discovery could not find in a workspace of
sibling clones. Discovery is checkout-local on purpose (`cmsl`), so that count
could never reach zero, and it counted *instances* where the risk is *paths*.
On cat-harness it read 3 while 0 of 134 declared paths resolved above the layer.
Count what breaks, not what is out of sight.

**A seeding pair is not upward (owner, 2026-10-04).** When the code moved to
the tools layer, the harness's Tool nodes kept their `src/tools/*` paths and
resolve into their implementer through `needs` ("Trap 1"), so the count read
23 for the harness. The two are seeded in the same step, so none of those can
break on seeding day. The HIGHER instance says so, `seedsWith: [<lower>]` in
its declaration, because a lower instance naming one above it is the wrong
direction. `seed:ready` states such paths in its note and does not count
them; a path into any other instance above still counts.

Four things to keep straight:

- **The layer map is read off the declarations**: `livesAt.path` is the
  directory, the longest `needs` chain is the depth, and the next layer is
  every instance one level up that needs this one. Nothing in the tool names
  a directory.
- **Every threshold is in the decision table**,
  `decisions/seed-readiness-gate.dmn`. The script works out each criterion's
  verdict by evaluating the table with the other facts at zero, so changing
  "five" is a one-line edit to the table.
- **`heavy-mover` is a label a person applies** (owner, 2026-10-02). With
  none on the layer, the criterion passes. If the label cannot be read, the
  answer is `could-not-determine`.
- **The rehearsal runs only on request.** Owner, 2026-10-02: *"Optional, run
  only on request with --rehearse."* It copies the layer and its `needs` into
  a scratch workspace (~150 MB and ~8,000 tests for cat-harness) and refuses
  to start with less than 3 GB free. Without `--rehearse`, the standalone
  criterion is `could-not-determine`, so **`seed:ready` cannot answer
  `settled` until a rehearsal has run.** That consequence is the one constant
  `SETTLED_REQUIRES_REHEARSAL`.

Could-not-determine is never clean. GitHub lists at most 3,000 files per PR,
so a criterion that the unseen files could change is undetermined, and the
gateway answers `unknown` and stops. An unknown only withholds `settled`, though.
It never hides a finding that is already certain, so the table tests the
`not yet` rows first. `not yet` goes to *Drain*: land, close or re-target the
PRs it named, then ask again. The tool only reports. It never seeds, labels
or comments.

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
   publication ([`instance-publication`](../kg-core/instance-publication.md)).
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
  bump computed from the exported surface (`check:version-bump`).
- **Tags are plain `v<major>.<minor>.<patch>` in each new repository** (owner,
  2026-09-30): a standalone repository holds one instance, declared at its
  root, so the tag needs no name. `check:version-bump` reads the plain form
  only there; a repository of several instances — the parent while the pair
  is staged — keeps `<name>-v<major>.<minor>.<patch>`, because a plain tag
  could not say which instance it released.
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
  names, root-relative paths, graph typologies and `$schema` tags and QA out, IRIs
  under `https://litlfred.github.io/bootstrap/` with semver.
- Stage 6: bean `xsqm` — `bootstrap-tools/` re-created as a sibling; the Zod
  source moved down; import cone from 19 files / 11,577 lines to 12 / 2,249,
  `zod` only; `check:tools-closure` and `check:node-iris` added, each watched
  failing on a planted violation.
- Next: the README and diagram writers join bootstrap-tools; the publication
  plan; the standalone rehearsal; then the owner's authorisation.

cat-harness + cat-harness-tools follows the same stages.
