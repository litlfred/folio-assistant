---
# folio-assistant-5yhm
title: 'TERMINOLOGY: identification, mapping and adjudication — a glossary term is CHECKED against an existing terminology, never only minted'
status: todo
type: feature
priority: normal
created_at: 2026-09-25T04:51:06Z
updated_at: 2026-09-29T22:01:05Z
parent: folio-assistant-0lmb
---

Owner, 2026-09-25: *"extracting exsiting glossary needs compaision to existing
termonology/coding. there needs to be a whole set of skills on terminiology
indetificatio. mapping. ajdudication. bean up as todo. we will integrate, for
example, OCL at some point as a Tool"*.

## RE-SCOPED 2026-09-29 against what has since landed on `main`

This bean was written when the glossary only extracted. Three skills landed
while it sat uncommitted, and **two of its three original legs are now
answered**, so what remains is narrower and sharper than the title suggests:

| the ask | where it now lives | still open? |
|---|---|---|
| **identification** — what IS a term | `glossary-extract.ts` + [`glossary-terms`](../../cat-harness/skills/folio-core/glossary-terms.md) §"Extracted terms": per asset type, one `kg-` scheme each, `candidate` status, and a stated exclusion (BPMN lanes and roles go to the swimlane ledger) | **no** — `a13a` is scrapped |
| **which vocabulary owns a fact** | [`vocabulary-authority`](../../cat-harness/skills/folio-core/vocabulary-authority.md): SKOS authoritative for meaning, DC for resources, FHIR for clinical codes, DCAT for a release, with `exactMatch`/`closeMatch`/`broadMatch`/`relatedMatch` as the declared mapping | **no** |
| **mapping** — is this candidate ALREADY a concept somewhere authoritative? | nothing | **yes** — `7wou` |
| **adjudication** — the extractor and the terminology disagree | nothing | **yes** — `2i5f` |
| **a terminology service as a Tool** | nothing; `OCL` appears nowhere in the codebase | **yes** — `ejug` |

## The gap, stated precisely

The **model** for an external mapping exists — `vocabulary-authority` names
SKOS the hub and the four mapping predicates, and `glossary-terms` already
lets an authored term carry links to external SKOS concepts. **The CHECK does
not.** Nothing anywhere queries an authoritative terminology to ask whether a
candidate the extractor minted already has a concept, and nothing records the
answer. Every extracted term is asserted by the extraction and compared
against nothing, which is the owner's sentence exactly.

That is one stage, not a pipeline, and it is the whole of what this feature
now covers.

## The design observation that survives from the papers

`library/arxiv-2605.03537v1`'s **authority validation is its own skill with a
machine index** — TF-IDF over ~1.01 M authorised LCSH headings plus a live API
for name authorities — not an instruction inside the drafting prompt. Nothing
else in that paper is citable (n = 10 titles, the author comparing his own
system, a baseline decades old under superseded policy, and the paper's own
words: *"interpretive rather than strictly quantitative"*).

`library/arxiv-2606.04382v1` (LCSHBench) supplies the shape of the answer: score
under **two** match definitions, exact and concept, and read the GAP — a high
concept score with a low exact score is the right topic in the wrong
authorised form, a different and specifiable error from a topical miss. Its
two lead systems swap places depending on which mode is used (0.659 vs 0.623
exact; 0.732 vs 0.762 concept) and on the record's language. A mapping stage
returning one boolean cannot express any of that.

## Done when

- [ ] `7wou` — the check exists, with three states and an exact/concept pair
- [ ] `2i5f` — disagreement has a named outcome set and CALLS `adjudication`
- [ ] `ejug` — one terminology service as a Tool node, OCL confirmed first
- [ ] the glossary page reports mapped / unmapped / undetermined per term,
      and grades none of them
