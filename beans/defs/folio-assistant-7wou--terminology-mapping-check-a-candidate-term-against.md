---
# folio-assistant-7wou
title: 'TERMINOLOGY / mapping: check a candidate term against an existing terminology — three states, exact AND concept'
status: todo
type: task
priority: normal
created_at: 2026-09-25T04:51:47Z
updated_at: 2026-09-29T22:01:31Z
parent: folio-assistant-5yhm
---

Under `5yhm`, and **the live one** after the 2026-09-29 re-scope. The owner's
sentence, unchanged: *"extracting exsiting glossary needs compaision to
existing termonology/coding."*

## What exists, and the one thing that does not

[`vocabulary-authority`](../../cat-harness/skills/folio-core/vocabulary-authority.md)
settles WHICH vocabulary owns a fact — SKOS for meaning, DC for resources,
FHIR for clinical codes — and names `skos:exactMatch` / `closeMatch` /
`broadMatch` / `relatedMatch` as the declared mapping with stated equivalence.
[`glossary-terms`](../../cat-harness/skills/folio-core/glossary-terms.md) already
lets an authored term carry links to external SKOS concepts.

So the model is there. **Nothing performs the comparison.** No code asks an
authoritative terminology whether a candidate already has a concept, and
nothing records the answer. Every one of the extracted `kg-*` candidates is
asserted by the extraction and checked against nothing.

## Three states, and the third is the whole point

- `mapped` — matches an authorised concept. Carries WHICH one, and with which
  of the four SKOS mapping predicates.
- `unmapped` — checked, no match. A determined finding.
- `undetermined` — the terminology could not be reached, or the check did not
  run. **Never rendered as `unmapped`.** This is `dh4f`, and the terminology
  service is the component most likely to produce it (see `ejug`).

## Exact AND concept, as a pair from the start

From `library/arxiv-2606.04382v1`: score under both match definitions and read
the gap. High concept with low exact is the right topic in the wrong
authorised form — a different, specifiable error from a topical miss. Build it
as a pair rather than as a boolean somebody widens later.

## Done when

- [ ] which terminologies are in scope, and who decides
- [ ] the three states in a schema, `undetermined` carrying its reason
- [ ] exact and concept both reported, neither graded
- [ ] the result is a SIDECAR beside the glossary, not a field inside a term,
      so an unmapped term still renders and a re-extraction does not lose it
- [ ] the glossary page shows the three states and grades none of them
