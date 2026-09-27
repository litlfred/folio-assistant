---
# folio-assistant-yj6r
title: 'ESCAPES: 15 instance-boundary imports check:partition cannot see, and the gate that sees them but never fails'
status: in-progress
type: task
priority: normal
created_at: 2026-09-27T07:47:30Z
updated_at: 2026-09-27T07:48:15Z
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
[ ] `glossary` ruled on explicitly — it has 4 core importers and may genuinely
    be shared platform vocabulary rather than content; treated as content
    unless the owner says otherwise, and sequenced last for that reason
[ ] the import axis reads 0 `cat-harness ->` sibling escapes, measured by
    resolved import specifier and not by name occurrence
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
