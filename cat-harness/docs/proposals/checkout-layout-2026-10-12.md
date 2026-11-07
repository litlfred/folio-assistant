---
title: "Checkout layout: which of the three standalone layouts is canonical"
kind: proposal
summary: >-
  Three definitions of "a checkout of a separated layer" are in force at once — the folio-assistant aggregate index, sibling clones under one parent, and remote mounts inside the downstream — and every tool resolves its roots for all three, by guesses that disagree. Measured 2026-10-12: the graph-typology registry read kinds from the harness module's grandparent while the checks read declarations from cwd, so one file got two answers in two layouts (fixed in place, lesson 19); 31 cat-harness-tools scripts compute a root as `import.meta.dir/../..`; cat-harness-tools' own CI runs inside the aggregate. Four options; option 1 (remote mounts inside the checkout, everywhere, with package imports for code) is recommended. Not decided: the owner's ruling.
---

# Checkout layout: which of the three standalone layouts is canonical

**Status: proposal, not decided.** The owner's ruling is asked for in
[§5](#5-the-decision). Work item `f6gq` records the question as open: *"The
platform has three definitions of a standalone checkout in force … The ruling
settling which layout is canonical is still the owner's."* Nothing below has
been changed on the strength of this proposal; the one fix that landed with it
(§2.1) is a defect under **every** layout and needed no ruling.

## 1. The three layouts, as they exist today

| | layout | who uses it, measured 2026-10-12 | how a layer finds another |
|---|---|---|---|
| **A** | **Aggregate index** — the `litlfred/folio-assistant` checkout, every layer a directory in it, laid down from `index.lock.json` | cat-harness-tools' own PR CI (`pr-tests.yml`: check out folio-assistant as `fa/`, `mount-from-lock.sh`, swap the PR in at `fa/cat-harness-tools`); the parent's own workflows | by directory name, one level below the index |
| **B** | **Sibling clones** — each repository cloned beside the others under one parent directory | this container (`/home/user/*`); `seed:ready --rehearse` and `check:standalone` (work item `ho66`), which lay a layer and its `needs` out as siblings; `scripts/lib/roots.ts`'s fallback `../cat-harness` | by the sibling's declared `name` |
| **C** | **Remote mounts inside the checkout** — the downstream's own repository, with each layer it needs mounted at a pinned SHA under its root (`index.config.json` + `index.lock.json`, verified by tree digest) | `litlfred/smart-ra`, `litlfred/who-iris`, the `smart-*` IG repositories (work item `n3h9`), the publish Routine | by declared `name` inside the checkout; the lock pins the bytes |

Layout C is the only one a downstream folio uses, and the only one the
separation's own end state (kg-separation stage 11: *"a code dependency as a
`source.remote` instance in its root `index.config.json`, never a submodule"*)
describes. Layouts A and B are how the platform's own development and CI run.

## 2. What three layouts cost, measured

### 2.1 One file, two answers (fixed; kg-separation lesson 19)

`check:declared-dirs`, run from a **standalone** cat-harness-tools against
`smart-ra` (layout B tools, layout C target), threw *"unknown graph typology
fhir-artifact-index"* over `smart-base.json`. The mounted copy of the same
script, on the same files, reported 121 directories and 10 findings. Cause: the
shared graph-typology registry took its root as two levels above
`cat-harness/schemas/` — right in A and C, where the harness module sits inside
the checkout being read, and wrong in B, where it sits beside it. The kind is
contributed by `fhir-harness`, which is mounted in `smart-ra` and absent among
the siblings. Fixed in cat-harness (`defaultTypologyRoots`: the checkout under
inspection first, then the module's own), because a check must read kinds from
the checkout whose declarations it reads under **any** layout.

### 2.2 Fixed-depth roots (lesson 6) are right by coincidence

31 scripts in cat-harness-tools compute a root as `import.meta.dir/../..`, 8 of
them naming it `REPO_ROOT` (`check-reference-direction.ts:180` is one). From
`<tools>/scripts/` that is the **parent of the tools layer**:

| layout | `tools/scripts/../..` is | right? |
|---|---|---|
| A | the aggregate index | yes |
| B | the directory of sibling clones — a checkout of nothing | only if every sibling is the one wanted |
| C | the downstream checkout | yes |
| a lone clone of cat-harness-tools | whatever directory it was cloned into | no |

So one layout (C) makes 31 lesson-6 violations harmless and another (B) makes
them latent. That is the cheapest argument in this document: the layout decides
how many of these are bugs.

### 2.3 Resolution logic written three ways

`instanceRootsIn` has a branch for B (*"a plain directory of sibling clones …
has no repository for a clone to be foreign to"*, 86 tests once failed without
it); `roots.ts` resolves the harness by flag, then `$CAT_HARNESS_ROOT`, then the
sibling; `remote-mount` and `mount-from-lock` own C; CI for cat-harness-tools
builds A by hand and then deletes two `.git` directories so A looks like C
(`pr-tests.yml`, *"Make the swapped-in checkouts plain mounts"*). Every new
check inherits all three.

### 2.4 What `separation:cutover:check` saw

Run on cat-harness-tools as a lone checkout, the new gate reports
`needs cat-harness: missing` and `needs bootstrap-tools: missing` — its
`index.config.json` declares only itself, so in a lone checkout its own `needs`
resolve to nothing — and **90** references in its wiring to the monorepo's old
checkout (`folio-assistant/feedback`, `../../folio-assistant/schemas/` in
`adapters/mcp-server/tsconfig.json`, …). Run on `smart-ra`, it reports
**0** monorepo references and no wrong-direction import or reference in its own
instance. The downstream is cut over; the layer is not, because the layer is
only ever run inside A or B.

## 3. The options

### Option 1 — Layout C everywhere (recommended)

Every repository, the harness's own tool layers included, is a checkout that
mounts what it `needs` under its own root from `index.config.json`, pinned and
digest-verified. cat-harness-tools declares `cat-harness` and `bootstrap-tools`
as `source.remote` instances; its CI mounts them from its own lock instead of
checking out folio-assistant. Code across layers is imported as packages (work item
`f6gq` option 2, already the target), so no import climbs a directory.
Sibling clones survive only as an explicit development override
(`--harness` / `$CAT_HARNESS_ROOT`), never as a fallback a tool guesses.

- **Costs:** an `index.config.json` + lock per tool layer (bootstrap-tools,
  cat-harness-tools, core's tools); CI rewritten per repository to mount from
  its own lock; the `roots.ts` sibling fallback demoted; the 90 monorepo paths
  in cat-harness-tools fixed (they are defects in any layout).
- **Risks:** a pin bump becomes a commit in every tool layer, not only in
  downstreams (mitigated by `mount:remote --seed`, cat-harness-tools#161);
  mounts are gitignored, so a tool layer's own tree no longer shows the code it
  runs against.
- **Commits to:** one resolution rule — declared name inside the checkout — and
  `separation:cutover:check` can be required green in every repository, the
  platform's included.

### Option 2 — Layout B canonical (sibling clones)

Every repository is cloned beside its `needs` under one parent; tools resolve
a layer by the sibling's declared name; no mounts in development or CI.

- **Costs:** downstream folios (smart-ra, who-iris) would have to drop their
  mounts or keep a second layout anyway; nothing pins which commit of a sibling
  is used, so "green" depends on what happened to be cloned.
- **Risks:** the registry defect of §2.1 is the typical failure; every fixed-depth
  root of §2.2 becomes live.
- **Commits to:** an unpinned development layout and a pinned publishing one —
  two layouts, not one.

### Option 3 — Layout A canonical (the aggregate index)

All development and CI happen inside the folio-assistant index; separated
repositories are publishing artefacts only.

- **Costs:** the least today — it is what CI already does.
- **Risks:** a separated repository is never run on its own, so lesson 18 (*a
  separated checkout must run its own tests*) is unmet by design, and the 90
  monorepo paths in §2.4 are invisible because they resolve inside the index.
- **Commits to:** the monorepo as a permanent dependency of every layer's CI,
  which the separation arc set out to remove.

### Option 4 — Keep all three, gated

Rule nothing; require every check to pass under A, B and C (a matrix).

- **Costs:** three CI runs per gate and per PR; every resolution question
  answered three times, as today.
- **Risks:** none new — this is the status quo made explicit.
- **Commits to:** the cost of §2.3 indefinitely.

## 4. Recommendation (the author's judgement, not a finding)

**Option 1.** It is the layout every downstream already uses and the one the
separation's end state names; it is the only one with pinned, verified bytes;
it makes 31 fixed-depth roots correct instead of latent; and it lets
`separation:cutover:check` mean the same thing in a layer as in a folio. What
would change this recommendation: a measured CI cost of per-layer mounts that
exceeds the matrix of option 4, or a development workflow that needs to edit
two layers in one commit often enough that sibling clones must be first-class.

**Default if nothing is ruled:** nothing changes. All three layouts stay
supported as today; the registry fix (§2.1) and the two new checks stand, since
they hold under every layout.

## 5. The decision

| | question | options |
|---|---|---|
| **L1** | Which layout is canonical? | 1 · 2 · 3 · 4 (above) |
| **L2** | If 1: does cat-harness-tools' CI move off the folio-assistant index to its own lock now, or after the 90 monorepo paths are fixed? | now · after |
| **L3** | If 1: is the sibling-clone fallback in `roots.ts` kept as a development override, or removed so a missing harness always throws? | keep (explicit flag/env only) · remove |

## Related

- Work item `f6gq` — package imports across layers; where this question was recorded as open.
- kg-separation lessons 5, 6, 18 and 19 (`skills/kg/graph-management/kg-separation.md`).
- `check:declaration-resolution` and `separation:cutover:check` (cat-harness-tools) — the measurements in §2.
- [Semantic subgraphs](semantic-subgraphs-2026-10-09.html) — the mount mechanics option 1 depends on.
