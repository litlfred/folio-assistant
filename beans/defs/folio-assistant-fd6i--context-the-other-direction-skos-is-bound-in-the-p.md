---
# folio-assistant-fd6i
title: 'CONTEXT, THE OTHER DIRECTION: `skos:` is bound in the published @context and emitted by ZERO nodes — and prose claims the graph speaks it'
status: todo
type: task
priority: normal
parent: folio-assistant-zzmr
created_at: 2026-09-20T19:55:26Z
updated_at: 2026-09-20T19:55:26Z
---

Found 2026-09-20 (session_017PqeiS4JYySSWGAYLedmus) while holding the `lqo9`
glossary roast, which asked which standards fit a knowledge graph. Answering it
required checking what this graph already speaks — and one of the answers was
wrong.

## The measurement

`SKOS_NS` is declared at `schemas/jsonld.ts:90` and bound as `skos:` in the
published context at `schemas/jsonld.ts:551` **and** in the shipped
`ns/content/v1.jsonld:11`. `schemas/tabular-csvw.ts:10` states in prose that this
graph *"already speaks eight published vocabularies — doco, deo, cito, oa, prov,
**skos**, dcterms, fhir"*.

Counted across the repository, excluding `node_modules`, `.git` and `beans/`
(`grep -rn '"<prefix>:'`):

| vocabulary | nodes emitting a predicate |
|---|---|
| `doco:` | 1111 |
| `dcterms:` | 4 |
| `prov:` | 2 |
| `cito:` | 2 |
| **`skos:`** | **0** |

Re-run before quoting these — the graph grows, and a count in prose is a claim
rather than evidence.

## Why this is NOT `ovkk`, and why the two belong together

`ovkk` is the same axis in the **opposite direction**: 34 property names the
`@graph` *uses* and the `@context` does **not** declare, so a JSON-LD processor
silently **drops** 3461+ property occurrences. Its consequence is data loss.

This is the inverse: a prefix the `@context` **declares** and the graph never
uses. Nothing is dropped, so no consumer breaks — which is exactly why it
survived. The consequence is a **false promise**: a consumer that dereferences
the context is told to expect SKOS terms and will never meet one, and a
maintainer reading `tabular-csvw.ts:10` is told a vocabulary is spoken when it
is not.

That is the `dh4f` shape — a declaration whose consumer scans nothing and reports
a clean run — one level up, in the vocabulary rather than in a directory.

**The two directions want ONE check, reporting both.** `kg:export` already
reports `undeclaredTerms` for `ovkk`'s direction. The other direction is the same
walk with the operands swapped, and a check that reports only one of them states
half a fact. This bean should be done **with or just after** `ovkk`, not instead
of it — `ovkk` is `in-progress` with PR #330 unmerged and is not this bean's to
resolve.

## The one thing that makes it non-trivial

An unused bound prefix is not automatically a defect. A context is also an
*interface*, and binding a prefix ahead of the first node that uses it is a
legitimate forward declaration — which is the honest reading of how `skos:` got
there. So the check cannot simply fail on zero occurrences.

What it can do is report the count per bound prefix and let a **declared**
reason cover a deliberate forward declaration, the same shape
`coverage.exempt.<criterion>` takes in `check:subgraph-coverage`: a waiver with
no reason is a silence list. `deo:`, `oa:` and `fhir:` are bound in the same
context and should be counted too before anyone decides `skos:` is special —
this bean measured only the four with non-zero counts plus `skos:`.

## Either way, `lqo9` forces the question

`lqo9`'s standards roast recommends SKOS as the glossary model. If that is
adopted, `skos:` stops being a false claim by being made true. If it is
overturned, the honest consequence is that `skos:` comes **out** of both contexts
and out of `tabular-csvw.ts:10`. A bound prefix nothing emits should not survive
that decision in either direction.

## WIDENED BY MEASUREMENT, 2026-09-20 — it is three vocabularies, not one

`skos:` is now emitted (below). **The eight-vocabulary sentence is still
false**, and this bean understated the problem because it measured five of the
eight rather than all of them.

Re-measured across source, excluding `node_modules`, `.git`, `beans/`, the
gitignored `_kg/` and the generated `docs/assets/`:

| bound prefix | emitting sites | in the sentence? |
|---|---|---|
| `doco:` | 1112 | yes |
| `skos:` | **10** (135 nodes) — was **0** | yes |
| `dcterms:` | 5 | yes |
| `cito:` | 2 | yes |
| `prov:` | 2 | yes |
| **`deo:`** | **0** | yes |
| **`oa:`** | **0** | yes |
| **`fhir:`** | **0** | yes |
| `csvw:` | 0 prefixed | no — bound, not in the sentence |

Checked in BOTH forms rather than by one grep, because a vocabulary can be
spoken through a `@context` term alias instead of a `prefix:value` literal —
`title` → `dcterms:title` is exactly that, and a scan for the prefix alone
would miss it. `deo:` and `oa:` occur only at their own `const` and their
binding line. `fhir:`'s only hits are a PROSE comment explaining why a block is
deliberately **not** typed `fhir:ValueSet`, and an unrelated `fhir:` object key
in `fsh-guts/scripts/generate-docs.ts`. No `@context` term maps to any of the
three.

**Stated limit.** `csvw:` is counted 0 here on prefixed values, but
`csvwOnly()` emits CSVW-native KEYS that resolve through the context, so csvw
may be genuinely spoken by alias. It is out of the sentence either way and is
left for whoever builds the bidirectional check; the point is that "0 prefixed
occurrences" and "not spoken" are different claims, and this table reports the
first.

So the repair `lqo9` slice 1 makes is **one of four**, and saying the sentence
is now true would be the same unearned claim in the other direction. The
honest positions are: emit `deo:`/`oa:`/`fhir:`, or correct the sentence to
name what is actually spoken.

## Done when

- [ ] Every prefix bound in the published `@context` is counted against the nodes
      that emit it, in the same place `ovkk`'s direction is reported
- [ ] A deliberate forward declaration carries a **declared reason**, not a
      silence
- [ ] `tabular-csvw.ts:10`'s eight-vocabulary sentence is true, or corrected —
      **still false**: `deo:`, `oa:` and `fhir:` each emit 0, measured above
- [x] `skos:` is either emitted (via `lqo9`) or removed from both contexts —
      **emitted**, 2026-09-20: 135 `skos:Concept` nodes in 3 `skos:ConceptScheme`s
      from `ns-export.ts`, falsified by five mutations

Related: `ovkk` (the other direction, in-progress, PR #330), `lqo9` (the glossary
roast that surfaced this), `zzmr` (KG structure and publication), `ulqj`/`eief`
(the CSVW work whose prose carries the claim).
