---
# folio-assistant-2i5f
title: 'TERMINOLOGY / adjudication: the extractor vs the terminology, and judge vs judge — call the existing process, restate nothing'
status: todo
type: task
priority: normal
created_at: 2026-09-25T04:51:47Z
updated_at: 2026-09-29T22:02:08Z
parent: folio-assistant-5yhm
---

Under `5yhm`. **Two disagreements, not one**, and only the second is already
solved here.

1. **The extractor and the terminology disagree.** The corpus uses a word the
   authorised vocabulary spells differently, or does not carry at all. A
   *content* decision — change the prose, author a local term with its reason,
   or record that the vocabulary is wrong for this domain. Nothing covers this.
2. **Two judges disagree about a mapping.** Already
   [`adjudication`](../../cat-harness/skills/folio-core/adjudication.md) plus
   [`untainted-verification`](../../cat-harness/skills/folio-core/untainted-verification.md).
   This must **call** them, never restate them: `adjudication.md` already
   defines the entry condition (*"entries for ONE criterion disagree"*) and
   consensus (*"entries of different kinds agree on one criterion"*), and
   `untainted-verification` already carries the three independence rules.

## What LCSHBench adds that is genuinely NOT here

`library/arxiv-2606.04382v1` never collapses a disagreement. It records which
library asserted which heading and releases three answer-key views —
per-catalog, merged/union (its default) and unanimous — so a consumer chooses
the strictness rather than inheriting the benchmark's. Its independence rule
(agency-level, MARC 040, so a copy-catalogued record is not a second
judgement) is an instance of discipline this repo already holds in
`untainted-verification`, not a novelty.

Here, adjudication always collapses to one verdict, which is right for a gate.

## The artefact that visibly wants the un-collapsed form

Re-checked 2026-09-29, still true: **`cat-harness/library/image-verdicts.json`
has exactly one `inspected_by`** at the top of the file, covering every
document in it (two so far). A second agent inspecting the same image
overwrites the first, and the format cannot record that two readings differed.

`m4xy` exists because one agent's reading — *"fragments of one composite
architecture figure"*, *"byte-identical"*, *"383 descriptions would be
fabrication"* — was wrong on all three counts, and a second independent
inspection is exactly what would have caught it. Whether verdicts should carry
dissent is the owner's call, and it is a **separate bean if wanted**, not this
one; noted here because it is where the evidence points.

## Done when

- [ ] the two disagreements are named and kept apart
- [ ] case 2 CALLS `adjudication` and `untainted-verification`, restating neither
- [ ] case 1 has an outcome set, each outcome saying what is written and where
- [ ] whether a term mapping keeps its dissent or collapses — owner's call
