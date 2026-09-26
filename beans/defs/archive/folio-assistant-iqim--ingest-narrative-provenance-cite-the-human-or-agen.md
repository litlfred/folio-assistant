---
# folio-assistant-iqim
title: 'INGEST: narrative provenance — cite the human or agent (with model version) that wrote it'
status: completed
type: task
priority: normal
created_at: 2026-09-16T06:43:50Z
updated_at: 2026-09-19T15:25:55Z
parent: folio-assistant-slw1
---

## What

Every generated narrative — an image description, a transcript, a translation,
a dataset summary — records **who wrote it**: a human, or an agent together with
its **model version**.

## Why

A narrative description is a claim by someone, not a property of the file. The
difference between "a human curator described this figure" and "a model
described this figure, version X" is exactly the difference a reader needs in
order to weigh it — and it is unrecoverable once lost.

It also makes a stale description findable: when a model is superseded, its
descriptions can be re-generated or re-reviewed *as a set*.

## Done when

The provenance field is required by the schema, not merely permitted, and the
L1 completeness gate (`folio-assistant-pn6j`) fails a narrative that lacks it.

Diagram: `processes/ingest-derive-content.bpmn`, `Task_Provenance`.

_2026-09-19T15:17:59Z_ — Claimed by claude/ecstatic-goldberg-eroyaz — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## 2026-09-19 — the closed union, and what a gate over zero narratives can honestly claim

Done. `schemas/attribution.ts` is the vocabulary; `check:l1-complete` enforces
it; `narrative-provenance` leaves `NOT_DERIVABLE` (5 → 4: `twqe, d5f1, 1r0p,
p67i`).

**The measurement that shaped the design.** `provenance` was an open string, and
every one of the **424 blocks in `library/` carries `"ingested"`** — written at
4 sites in `gen-library-jsonld.ts`. The L1 gate checked `"provenance" in m`:
presence only. So it passed on a value that says what happened and never who
did it. And **there is not one narrative in the corpus** — all 424 blocks are
`kind: "prose"`, verbatim extracted text, for which `"ingested"` is the *honest*
value. Nobody authored it.

**So the risk was a vacuous gate**, and the brief named it as the falsifier: a
checker that finds no narrative to fail is indistinguishable from a checker that
is broken. Three things answer it.

1. `Provenance` is a **closed** union — the literal `"ingested"`, or an
   `Attribution`. This validates all 424 blocks today, so the gate is not idle.
   Closing it does not stop an arm asserting something false; it makes the
   *omission* impossible, because a new arm has to choose and `"ingested"` for a
   generated description is a false statement rather than a missing field.
2. `LIBRARY_BLOCK_ORIGIN` classifies each library block kind `extracted` or
   `authored`, and a test asserts it is **total over what actually occurs in
   `library/`**. A narrative arm cannot land a new kind without classifying it.
3. The authored branch is proved by **fixtures**, never by the corpus, and all
   three branches are **mutation-checked**: `if (false && …)` on each one fails
   a named test (1, 3 and 3 tests respectively).

The narrative count is reported as a determined number including zero — "no
narratives here" and "the classifier never ran" are different facts.

**`agent` must name its `model`, structurally**, not by convention. That is the
bean's actual demand, and an agent attribution without it records that a machine
wrote the thing while losing the only part anyone can act on later.

**One vocabulary, not two.** `block-qa.ts` now re-exports `ATTRIBUTION_KINDS` as
`QA_REVIEWER_KINDS` — same three participants, `rlp5`'s lesson applied. Order
pinned to what block-qa always exported, so the re-spelling cannot silently
reorder. `QaReviewer` itself is NOT reused: `script_hash`/`deps_hash`/`def_hash`
are about a criterion's cached verdict going stale, which has nothing to do with
authoring.

**Two defects caught in my own work.** `check:schema-nodes` refused the new
module for carrying no `@graphNode` tag. And I wrote `expect(...).toContain("met")`
over a state whose failure value is `"unmet"` — which **contains** `"met"`, so
the assertion passed in both directions. Found by reading it back, not by a
gate; now `toBe`.

Tests: 19 in `scripts/tests/attribution.test.ts`, plus the `ingest-and-l1`
fixture rewritten to emit real `.jsonld` blocks (it wrote `b0.json` containing
`{}`, which satisfied a file-COUNT requirement and nothing else — fine until a
requirement looked inside).

2 768 pass / 0 fail; tsc, eslint and 27 CI gate lines green.
