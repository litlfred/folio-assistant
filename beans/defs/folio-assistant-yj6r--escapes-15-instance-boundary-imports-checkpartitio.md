---
# folio-assistant-yj6r
title: 'ESCAPES: 15 instance-boundary imports check:partition cannot see, and the gate that sees them but never fails'
status: in-progress
type: task
priority: normal
created_at: 2026-09-27T07:47:30Z
updated_at: 2026-09-30T10:28:59Z
parent: folio-assistant-vke6
---

Found 2026-09-27 while answering the owner's question *"how resolve/gate/qa escape
imports?"* — sibling to `zlmp` under the same SPLIT epic, and **not** a reopening
of it.

## Two axes, and only one of them has ever been driven to zero

`zlmp` drove the MODULE axis to zero: `check:partition` reports **0**
wrong-direction edges today, and that is correct on its own terms — it measures
edges between assigned modules against the declared module graph.

The axis it does not measure is **instance-directory boundaries**. Measured on
`origin/main`:

    cat-harness -> folio-assistant-core/schemas     14
    cat-harness -> folio-assistant-core/scripts      1
                                          total     15

`cat-harness` declares `needs: ['bootstrap']`. It does not declare
`folio-assistant-core`, which sits ABOVE it. So every one of these 15 is an
import against the instance's own declaration, and after a repository cut each
becomes a circular dependency between repositories — the same consequence
`zlmp` records for its own axis.

**The falsifier fired on my first framing.** I reported this as "nothing sees
them". Something does — see the gate section. What is true is narrower: nothing
FAILS on them.

## The clusters — 8 schemas, not 15 edits

    external-schema        3   scripts/external-schemas.ts,
                               scripts/gen-external-schemas-viz.ts,
                               scripts/gen-object-model-uml.ts
    dublin-core            2   adapters/document/intake-records.ts + .test.ts
    materialization        2   scripts/cache-index.ts,
                               scripts/tests/materialized-fixity.test.ts
    fhir-artifact-index    2   scripts/check-artifact-index.ts,
                               scripts/ingest-ig-artifacts.ts
    glossary               2   content/pipeline/build-glossary.ts,
                               content/pipeline/build-glossary-skos.test.ts
    library-ref            1   scripts/check-voices.ts
    extraction            1   scripts/extract-assets.ts
    changeset              1   scripts/tests/build-document-site.test.ts
    core/scripts/glossary-page.ts  1  content/pipeline/build-glossary-skos.test.ts

Five of the fifteen are tests.

## The cheap fix works and is WRONG — write this down before someone finds it

Importers of each schema, by instance:

    schema                 core  cat-harness  other
    external-schema           0      3          -
    library-ref               0      1          -
    extraction                0      1          -
    dublin-core               0      2          who-iris 1
    fhir-artifact-index       0      2          smart-trust 1
    materialization           0      2          who-iris 3
    glossary                  4      2          -
    changeset                 1      1          -

**Six of the eight have no core importer at all.** And core sits ABOVE
cat-harness, so core importing DOWN from cat-harness is legal. Therefore moving
all eight schemas down into `cat-harness/schemas/` would resolve all 14 edges
and leave every existing importer legal — who-iris, smart-trust and core are all
above cat-harness.

Do not do it. Dublin Core metadata, a glossary, a library reference and asset
extraction are CONTENT concepts, and `AGENTS.md` is explicit that
folio-assistant is the platform and not the content. That move would buy a green
gate by relocating the boundary the gate exists to protect: the count reaches
zero and the architecture is worse. It is recorded here precisely because it is
tempting, cheap, and passes.

## The resolution: consumers move UP

The evidence says these are content tools misfiled in the platform —
`external-schemas`, `extract-assets`, `cache-index`, `check-artifact-index`,
`ingest-ig-artifacts`, `check-voices`, `build-glossary`, and
`adapters/document/intake-records.ts` whose own directory is named for a CONTENT
adapter.

Corroborated independently: `zlmp` already records
`adapters/document/resolver.ts` as *"classified core by its `adapters/document/`
path while its contents are the paper resolver"*, noticed from the other side.
Two sightings of one misfiling is a pattern.

## The gate EXISTS, sees all 15, and fails on none

`check:reference-direction` (+ `:strict`) resolves direction through
`allowedFromNeeds` in `schemas/layer-direction.ts` — it reads `needs`, which is
the right mechanism. Its `--findings` output contains **all 15**; they sit inside
770 wrong-direction occurrences across 206 files, with `cat-harness ->
folio-assistant-core` at 215.

Three gaps, each measured rather than inferred:

1. **Its exit-1 criterion is narrower than its finding set.** It fails on files
   naming SEVERAL instances above them (29 today) and on `PENDING` drift. A
   single-target escape — which all 15 are — is counted and not failed.
2. **No workflow invokes either form.** Zero invocations across all workflows.
   That is `ot9a`'s class and the `1xhc` epic: a gate that does not fire is
   indistinguishable from one that passed.
3. **It prints and commits nothing.** No sidecar, and no `kg-qa` criterion
   covers the direction axis, so for this axis "never audited" and "audited
   clean" are indistinguishable — the exact thing the sidecar design exists to
   prevent.

`--strict` cannot simply be wired: it fails on all 770 today, and `PENDING` is
deliberately a FIXED list, its own comment saying *"a PENDING that only grows
stops meaning anything."*

## Order — the owner chose it, and their reason is better than mine

Asked which to build first, the owner answered **"2 1"**: resolve the clusters,
THEN wire the gate. I had recommended the reverse. Their ordering is better and
the reason is worth keeping: **at zero you do not need a baseline at all.** A
baseline mechanism exists only to hold a number above zero, so resolving first
deletes the need for the part I proposed building.

## Done when

[ ] each of the 8 clusters adjudicated and landed, cheapest first, one PR each:
    `external-schema` (3) -> ingest/materialisation (4) -> `dublin-core` +
    `adapters/document/` (2) -> `library-ref` (1) -> `changeset` (1) ->
    `glossary` (2+1) LAST
    — **7 of 8 landed; ALL 8 adjudicated.** `dublin-core` + `adapters/document/`
    is the one left, and it is left ON A MEASUREMENT rather than unreached:
    hoisting that directory removes 2 escapes and creates 15 (see this bean's
    last Summary of Changes). Its closure is a three-instance move and needs its
    own ruling. NOT ticked, because "adjudicated" and "landed" are both in this
    line and only one of them is true of the eighth
[x] `glossary` ruled on explicitly — the owner ruled 2026-09-30 that it is
    CONTENT: `build-glossary.ts` moves UP into `folio-assistant-core`, the
    schema stays. Landed on `claude/yj6r-glossary-cluster` (PR #1541, issue
    #1540). The four core importers turned out to be the whole of it — all
    core's own glossary tooling — so it is not shared vocabulary
[ ] the import axis reads 0 `cat-harness ->` sibling escapes, measured by
    resolved import specifier and not by name occurrence
    — **reads 2** as of PR #1561 (2026-09-30), down from 15. Both remaining are
    `adapters/document/intake-records.ts` and its test, on `schemas/dublin-core`.
    NOT earnable until the `adapters/` closure above is ruled on: there is no
    move that takes this to 0 without taking it through 15 first
[ ] only THEN: `check:reference-direction` wired into a workflow, with a failing
    criterion that bites on a single-target escape
[ ] the axis writes a committed sidecar, and `audit:coverage` reports the kind
    as JUDGED rather than merely typed

## NOT in scope

The 770 wrong-direction NAME occurrences on the prose axis, and the 5 instances
declaring no `needs` (`agent-skills`, `folio-assistant-sci`, `large-datasets`,
`who-iris`, `who-style-guide`) that make 11034 occurrences undetermined. Both
are real and both are bigger than this; folding them in would let the tractable
import axis wait on them.

## Themed sub-graphs: a sub-directory IS a declared subgraph — but only for skills/

Owner, 2026-09-27: *"breakdown of large graphes into themed sub=graphs-> sub-dir=named
ssubgraph declared by harness. make sure linked to existing infra"*.

Checked rather than assumed, and the infra is split down the middle.

### Works today, no code change — `cat-harness/skills/*`

`kg-detangle.ts`'s `SCAN` carries `{ path: "cat-harness/skills", groupDepth: 3 }`,
so every subdirectory of `skills/` is ALREADY a named subgraph — that is why
`folio-core`, `crdm` and `workflow` are groups at all. Each package declares
itself with `package-manifest.json`, and `skill:register` verifies the chain while
deliberately leaving *which package a file belongs to* to the author, which is
exactly the themed-carve assertion.

So a skills carve is: new subdir, `package-manifest.json`, move files,
`skill:register`. Detangle measures the new subgraphs on the next run.

### Does NOT work — `cat-harness/schemas` and `cat-harness/processes`

Both are `groupDepth: 2`, so `schemas/<theme>/foo.ts` still groups as
`cat-harness/schemas`. A themed subdirectory there produces NO new subgraph.

The code already says so, in a `declared-path-literal` marker on that line: *"the
scan list is REPO-relative and pairs each path with a grouping depth no
declaration carries; deriving it is its own change, not part of the byql fold."*
So the blocker is known and named, not discovered here.

### The inversion, which forces the order

    group                    mechanical seam           infra can name a subdir
    cat-harness/schemas      YES - 12 components,      NO  - groupDepth 2
                             129 ISOLATED files
    skills/folio-core        NO  - 1 component of 155  YES - groupDepth 3

The group that is easy to carve on evidence is the one the tooling cannot
express; the one the tooling supports has no free seam. So either `groupDepth`
becomes derived (or 3) before `schemas` is touched, or `folio-core` goes first
with its carve acknowledged as judgement at a real coupling cost.

### Done when

[ ] `groupDepth` derived from the declaration rather than hardcoded per path —
    the named prerequisite for any `schemas/` or `processes/` carve
[ ] `cat-harness/schemas` carved: the 70-node component, the 11 small ones, and
    the 129 isolated files ADJUDICATED rather than bucketed (129 files with no
    internal edge is not one decision, it is 129)
[ ] `cat-harness/processes` carved: 41-node core, 6 small components, 20 isolated
[ ] `folio-core` and `folio-paper-adapter` carved by declared theme, each with
    its reason recorded, since neither has a mechanical seam to appeal to
[ ] every new sub-directory carries a `package-manifest.json` (skills) or a
    declaration entry, so `skill:register` and `check:declared-dirs` see it

### NOT in scope

Renaming or re-homing anything outside the four groups. And the 129 isolated
files under `schemas/` are a finding in their own right, not carve residue: a
file that nothing in its own group references may belong elsewhere entirely, and
deciding that per file is a bigger job than drawing subgraph boundaries.


## Claimed by `claude/yj6r-glossary-cluster` — the GLOSSARY cluster (2026-09-30)

Claimed by branch `claude/yj6r-glossary-cluster` for the GLOSSARY cluster only, the last of the eight. No holder note existed on `main` when this was taken — `beans:claim` refused with `already-claimed` and no holder, which cannot tell a live sibling from an abandoned claim — so the open-PR list was read first: PR #1535 holds the ingest/materialisation tranche and nothing covered glossary. Recorded here so the next session does not have to repeat that check.


## Summary of Changes

### Cluster 2 of 8 — ingest/materialisation. Escapes 12 -> 8.

Landed on `claude/yj6r-ingest-materialisation`. Tranche 1 (`external-schema`)
had already taken the count 15 -> 12 on `main`; this takes it 12 -> 8, and all
four of the cluster's escapes are gone. **No schema moved down.** Both
`schemas/materialization.ts` and `schemas/fhir-artifact-index.ts` stayed in
`folio-assistant-core/schemas/`, which is the whole of §"The cheap fix works and
is WRONG".

    cat-harness/scripts/cache-index.ts                     -> folio-assistant-core/scripts/
    cat-harness/scripts/check-materialized-fixity.ts       -> folio-assistant-core/scripts/
    cat-harness/scripts/backfill-materialized-fixity.ts    -> folio-assistant-core/scripts/
    cat-harness/scripts/check-artifact-index.ts            -> folio-assistant-core/scripts/
    cat-harness/scripts/ingest-ig-artifacts.ts             -> folio-assistant-core/scripts/
    cat-harness/scripts/tests/cache-index.test.ts          -> folio-assistant-core/scripts/cache-index.test.ts
    cat-harness/scripts/tests/materialized-fixity.test.ts  -> folio-assistant-core/scripts/materialized-fixity.test.ts
    cat-harness/scripts/tests/ingest-ig-invocation.test.ts -> folio-assistant-core/scripts/ingest-ig-invocation.test.ts

Tests sit BESIDE their subjects in `folio-assistant-core/scripts/`, which is
that instance's existing convention (`sample-import-run.test.ts`), not in a
`tests/` subdirectory as in `cat-harness/`.

### The partition had already adjudicated all five, and that is the evidence

The cluster was not decided by reading names. `scripts/partition/instance-rules.ts`
on `main` classified `check-artifact-index.ts` and `ingest-ig-artifacts.ts`
`repo: "core"` in as many words — *"a script is not automatically tooling-side,
and this one's SUBJECT is content"* — and `cache-index.ts`,
`check-materialized-fixity.ts` and `backfill-materialized-fixity.ts` sat in the
same `core` block. So the MODULE axis had already ruled; only the DIRECTORY
disagreed, which is exactly why `check:partition` read 0 while 4 escapes stood.
The move makes the layout state what the rule already said, and the now-dead
`exact` entries were removed with their reasoning kept in place as a note — a
rule naming a path its own scan can no longer see fires on nothing while reading
as an adjudication.

### Two beyond the four named, and why

`check-materialized-fixity.ts` and `backfill-materialized-fixity.ts` were not in
the cluster list. They moved because `materialized-fixity.test.ts` — which WAS —
tests them, and a test does not leave its subject to make a count fall. The
counter-argument was weighed: `check:materialized-fixity` guards
`cat-harness/skills/remote/`'s own materialized packages, so after a repository
cut cat-harness would carry no fixity gate over its own bytes. It loses, because
it is a generic property of every core-classified checker that scans a lower
instance (`check-undeclared-files.ts` is the same shape), not a fact about this
file — and this repository's standing rule is that a checker's layer follows its
SUBJECT SCHEMA, which here is core's `materialization.ts`. `backfill` writes a
`fixity` object whose shape core owns, so it is a consumer of that schema in
substance even though it constructs the literal rather than importing it.

### Measured, before -> after

    escape imports under cat-harness/       12 -> 8   (all 4 of this cluster)
    check:partition wrong-direction          0 -> 0   (blocking gate; unmoved)
    check:reference-direction wrong-dir    798 -> 798 in 213 -> 212 files
    PENDING entries failing the check        1 -> 1   (see below)

`check:reference-direction` **exits 1 on `origin/main` unchanged**, measured in a
clean worktree at `16c41921e13`: `cat-harness/scripts/gen-object-model-uml.ts`
*"now names ONE instance"*, a leftover of tranche 1. That failure is untouched
here and is NOT this branch's. This branch's own PENDING entry for
`check-artifact-index.ts` stopped qualifying once the file moved and was deleted,
as the checker's own message instructs.

### One coverage loss, reported rather than papered over

`root-scan-census` is INSTANCE-scoped (`INSTANCE_ROOT/scripts`, sidecar under
`cat-harness/test/results/`), so `check-artifact-index.ts` left its census:
68 enumerating scripts -> 67, and the `seeded-at-root-not-git-aware` family
3 -> 2. That is correct for cat-harness — the file is no longer its script — but
`folio-assistant-core` runs no equivalent census, so the row is now counted
nowhere. Same shape as `p11x` one axis over. Not fixed here; naming it so the
next tranche does not read the smaller number as an improvement.


## Summary of Changes — the GLOSSARY cluster, 2026-09-30

Branch `claude/yj6r-glossary-cluster`, PR #1541, issue #1540. The eighth and
last cluster. The bean is **not** marked completed: the gate-wiring half (the
owner's "2 1" order) and the other seven clusters' tranche PRs are still open.

**Escapes 12 -> 9**, measured by resolved import specifier on `origin/main`
at `99371e88964`. PR #1535 is NOT merged into that base, which is why the
before figure here is 12 rather than the 8 that PR reports after its own
move. `check:partition` **0 before, 0 after**.

Five files moved to `folio-assistant-core/scripts/`, beside the
`schemas/glossary.ts` and `scripts/glossary-page.ts` they read:

    build-glossary.ts             content/pipeline/ -> core/scripts/
    build-glossary-skos.test.ts   content/pipeline/ -> core/scripts/
    build-glossary-usage.test.ts  content/pipeline/ -> core/scripts/
    codemod-refterm.ts            content/pipeline/ -> core/scripts/
    codemod-refterm.test.ts       scripts/tests/    -> core/scripts/

No schema moved down. The cheap fix this bean forbids was not taken and is
not reachable from this diff.

### Three things found by reading the code that the cluster list could not see

1. **`codemod-refterm.ts` imports `buildGlossary` directly.** Moving the
   builder alone trades one escape for another: 12 -> 10, not 12 -> 9. The
   cluster list was derived from a grep for core imports, so a dependent that
   reaches the boundary only through another file is invisible to it. It moved
   with its subject, on the same evidence: Phase C of the same
   `\defterm`/`\refterm` rollout the builder is Phase D of.

2. **The partition rules already classified the whole cluster core.**
   `scripts/partition/instance-rules.ts` assigns the `content/pipeline/`
   prefix to the `core` repo, so `build-glossary.ts` has been a core module on
   the module axis the entire time. That is a FOURTH piece of evidence for the
   owner's ruling and it is independent of the other three. It is also why
   `check:partition` reads 0 over this cluster and always did: its scan root is
   `cat-harness/`, so an edge leaving that directory is never resolved and
   never counted. A green `check:partition` was never evidence about these
   three imports either way.

3. **Both scripts are addressed by id, not by path,** through
   `resolvePipelineScript` — the `glossary-build` Tool node, `glossary_check`,
   and the `codemod` transform tool's `refterm` entry. That resolver searched
   two places; it now searches `folio-assistant-core/scripts/` LAST, so a
   folio's own fork still wins and the platform's copy still wins over
   core's. Two tests pin it, because the failure without them is a tool
   returning `pipeline script not found` — honest and inert, and no gate tells
   that from a script nobody asked for.

### Measured, both directions

`check:reference-direction` went **798 -> 811 occurrences, 213 -> 216 files**
— UP. That gate counts NAME occurrences in prose, and this change necessarily
writes the string `folio-assistant-core` into `cat-harness/` files in order to
say where the code went. That axis is explicitly out of scope for this bean;
the import axis, which is not, went down by 3. Reported rather than smoothed.

`check:reference-direction` **already exits 1 on `origin/main`** with the
identical finding (`gen-object-model-uml.ts` no longer qualifies as PENDING).
Verified by stashing and re-running on the clean base. Not mine, not fixed
here.


## Claimed by `claude/yj6r-last-clusters` — the LAST FOUR clusters (2026-09-30)

`beans:claim` refused with `already-claimed`, naming `claude/yj6r-glossary-cluster`.
That holder's work has LANDED — PR #1541 is merged and is this branch's own base
commit (`27090a171c2`) — so the claim was spent rather than live. Checked before
assuming, as the previous session's note asks: the open-PR list was read and no
open PR covers `yj6r`. Recorded so the next session does not repeat the check.


## Summary of Changes — the LAST FOUR clusters, 2026-09-30

Branch `claude/yj6r-last-clusters`, PR #1561, issue #1558. Measured on
`origin/main` @ `27090a171c2`.

**Escapes 5 -> 2. The import axis does NOT read 0**, and the box above is not
yet earnable. Stated rather than tuned around.

    check:partition       0 wrong-direction, 0 unassigned — before AND after

Three clusters landed the way §"The resolution: consumers move UP" prescribes.
**No schema moved down.** `dublin-core.ts`, `library-ref.ts`, `extraction.ts`
and `changeset.ts` are untouched in `folio-assistant-core/schemas/`.

    extraction   scripts/extract-assets.ts       -> folio-assistant-core/scripts/
    library-ref  scripts/check-voices.ts         -> folio-assistant-core/scripts/
    changeset    scripts/build-document-site.ts  -> folio-assistant-core/scripts/
                 scripts/tests/build-document-site.test.ts -> core/scripts/*.test.ts

### The local dependent the cluster list could not see — the MIRROR of the glossary one

`build-document-site.ts` was never itself an escape; its TEST was. The glossary
tranche found a dependent that rode along into the boundary; this one is the same
blindness read the other way — a SUBJECT the list never named, because the list
was derived from a grep for core imports and the subject makes none.

It moved on the rule the ingest/materialisation tranche set: **a test does not
leave its subject to make a count fall.** And on independent evidence — the
partition rules already classified it `core` in as many words. That was true of
all four: every one had an EXACT `core` entry, so only the DIRECTORY disagreed,
which is exactly why `check:partition` read 0 while five escapes stood. Each dead
entry was removed with its reasoning kept in place.

### The dublin-core cluster STAYS, and the reason is a measurement

Its consumer is `adapters/document/index.ts` — 51 KB of
`DocumentContentAdapter` — so hoisting the leaf alone moves the same upward
import onto a bigger file. Hoisting the whole of `adapters/document/`, which the
partition rules already classify `core` BY PREFIX and `src/builtin-adapters.ts`
already declares `layer: "core"`, was measured rather than assumed:

    escapes removed by the move      2   (intake-records.ts and its test)
    escapes CREATED by the move     15   (6 in adapters/paper/index.ts,
                                          9 across 6 scripts/tests/*.test.ts)

**2 -> 15**, the wrong way on the one axis this bean exists to drive, because
`PaperContentAdapter extends DocumentContentAdapter` and pulls five of its tool
registrars besides, from a THIRD layer again. The closure is a three-instance
move with a newly declared `adapters/` in each of two targets and a re-pointed
`BUILTIN_ADAPTERS` table. Its own tranche, with its own ruling to ask for; doing
half of it is strictly worse than doing none.

The measurement is written into `intake-records.ts`'s module doc rather than only
here, because that is the file the next agent driving this axis opens first and
the cheap half-move is what the cluster list alone makes look obvious.

**A correction to this bean:** §"NOT in scope" lists `folio-assistant-sci` among
the five instances declaring no `needs`. It declares `needs:
["folio-assistant-core"]` today. That does not change the verdict — the cost is
the 15 created escapes, not a missing declaration — but the note is stale.

### check:reference-direction — reported, and it moves the wrong way

    wrong-direction occurrences          1219 -> 1226
    files                                 277 -> 276
    non-PENDING multi-instance (FAILING)   76 -> 78

**It already exits 1 on `origin/main` unchanged** — verified by stashing and
re-running on the clean base. Not this branch's, not fixed here. The third tranche
in a row to measure this.

Two files were added to the failing list and both were looked at rather than
absorbed: `skills/library/library-core/asset-extraction.md` (already named `who-iris`; the
path edit added `folio-assistant-core` — unavoidable, since the skill documents a
command by path and the command moved), and the new note in `intake-records.ts`,
whose FIRST DRAFT named two instances and was rewritten to name one. A note
explaining an upward reference should not itself become the finding.

### One coverage loss, reported rather than papered over

`root-scan-census` is INSTANCE-scoped, so `check-voices.ts` left it: **66
enumerating scripts -> 65**. Correct for cat-harness, but core runs no equivalent
census, so the row is now counted nowhere. The ingest/materialisation tranche
reported the identical shape at 68 -> 67 — twice now, which makes it a property of
moving anything up rather than an accident of one file.



### The coverage loss now has its own bean — `tqv4`

The two "one coverage loss, reported rather than papered over" boxes above
(68 -> 67, then 66 -> 65) are one defect reported twice. Filed 2026-09-30 as
`folio-assistant-tqv4`, with the sharper half measured: the census's headline
family `seeded-at-root-not-git-aware` reads **0 of 0**, and the repository's
only instance of that shape — `folio-assistant-core/scripts/check-artifact-index.ts`,
a `readdirSync(ROOT)` with no git call — is in the instance the census does not
scan. The family is empty because its subject moved out, not because the shape
was eliminated.
