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

- [x] which terminologies are in scope — **owner, 2026-09-30: "OCL is only for
      FHIR. not a constraint on SKOS."** So there are TWO targets, not one:
      `skos` resolved against this instance's authored concepts (and the
      external URIs they carry), `fhir` against a FHIR terminology service
      with OCL named for the WHO SMART Guidelines side.
- [x] the three states in a schema, `undetermined` carrying its reason —
      refused structurally without one
- [x] exact and concept both reported, neither graded
- [x] the result is a sidecar, not a field inside a term — projected to
      `cat-harness/test/results/term-mapping.qa-results.json`
- [x] registered as a gate: `bun run check:term-mapping`, in package.json and
      the gate workflow, verifying rather than writing
- [ ] the glossary page shows the three states (the check exists; the page
      does not read it yet)
- [ ] declare FHIR collections in scope, once OCL is reachable and somebody
      decides which

## Built 2026-09-30 — and the first run's answer is zero

`schemas/term-mapping.ts` + `scripts/check-term-mapping.ts`, 12 tests.

| target | result |
|---|---|
| `skos` | 2 594 candidates: **0 mapped, 2 594 unmapped**, 0 undetermined |
| `fhir` | 2 594 candidates: 0 mapped, 0 unmapped, **2 594 undetermined** |

**The FHIR zero is the third state doing its job, not a failure.** This
environment's network policy refuses `api.openconceptlab.org:443` — the proxy
logs *"gateway answered 403 to CONNECT"* — so not one row may say `unmapped`.
A terminology that could not answer has said nothing. The reason travels on
every row and on the scope.

**The SKOS zero is a real finding, and it was checked rather than assumed.**
A check that always returns zero is indistinguishable from a broken one, so
the index was probed directly: its 7 keys are `associated harness`, `policy`,
`permission`, `task run`, `actor`, `role`, `glossary`, and no candidate's
`prefLabel` normalises to any of them. Near-misses exist (`Glossary build`,
`role-model`, `swimlane-glossary`) and are genuinely different terms. The
positive cases are pinned on fixtures with deliberate collisions — a
prefLabel hit that is `exact`, an altLabel hit that is `concept` but not
`exact` — so the index cannot silently stop working.

**What the zero says.** The authored glossary and the extracted one are
disjoint vocabularies: 7 domain concepts against 2 594 names for assets —
skills, Tool nodes, BPMN activities, schema fields. They are different KINDS
of term, which is the question `a13a` was scrapped for having already been
answered by `glossary-extract.ts`, now visible as a measurement.

No ratio is computed and none should be. `m4xy`'s rule carries: an unmapped
candidate may be a term this corpus is right to coin.
