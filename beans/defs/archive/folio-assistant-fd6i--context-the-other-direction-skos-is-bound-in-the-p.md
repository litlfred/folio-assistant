---
# folio-assistant-fd6i
title: 'CONTEXT, THE OTHER DIRECTION: `skos:` is bound in the published @context and emitted by ZERO nodes — and prose claims the graph speaks it'
status: completed
type: task
priority: normal
created_at: 2026-09-20T19:55:26Z
updated_at: 2026-09-22T07:23:02Z
parent: folio-assistant-zzmr
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

## SHIPPED, 2026-09-21 — and MY OWN MEASUREMENT WAS WRONG, in the interesting way

`check:context-emission` is a gate. But the number this bean carried, and the
one I put in PR #637 this morning, were **measuring the wrong corpus**.

### Source occurrences are not emissions, and the two disagree completely

The earlier table scanned `.ts` source for `prefix:` literals. Re-measured
against the **1086 published `.jsonld` documents** — the things a consumer
actually dereferences:

| prefix | source hits (the old number) | EMITTED by a document |
|---|---|---|
| `doco` | **1112** | **0** |
| `dcterms` | 5 | **1551** |
| `prov` | 2 | **952** |
| `cito` | 2 | 2 |
| `skos` | 10 | **0** |
| `deo`, `oa`, `fhir` | 0 | 0 |
| `fac` | — | **0** |

**`doco` inverted completely and `dcterms` by a factor of 300.** The 1112 are
`BLOCK_KIND_TO_DOCO_TYPE`'s entries in `jsonld.ts`, a mapping table that fires
only when a BLOCK is exported — and this instance is the platform, so no block
is ever exported here. Meanwhile `dcterms` is spoken through the term alias
`title`, which a prefix scan cannot see at all.

So it is **seven** bound-and-unemitted prefixes, not three, and one of them is
`fac` — folio-assistant-core's own namespace. And `skos:`, which `lqo9` slice 1
was written to fix, is **still zero in this context**: those 135 concepts went
into the NAMESPACE document, which carries its own context. That is a real
correction to what #637 claimed.

**A vocabulary is spoken when a document says it, never when a mapping table
mentions it.** The check counts documents.

### Two ways a prefix is spoken, and missing either invents a finding

1. a literal CURIE — `"@type": "doco:Section"`;
2. a **term alias** — `title` → `dcterms:title`, so a node carrying `title`
   emits `dcterms:` with no `dcterms:` anywhere in the file.

A scan for the prefix alone sees only the first and reports `dcterms` as dead
while 1551 nodes speak it. That is why the old number was not merely imprecise
but backwards.

### The third state this bean asked for

*"A deliberate forward declaration carries a declared reason, not a silence."*
`FORWARD_DECLARED` holds one per unemitted prefix, each naming **what would
emit it** — so "is this still deliberate?" has an answer rather than needing
archaeology. A prefix with neither an emission nor a reason fails the gate.
A reason under 40 characters fails a test: a one-word reason is a silence with
extra steps.

A forward declaration that **starts** emitting is reported as stale, because
otherwise a later silence hides behind a reason that already came true.

### Falsified six ways

| mutation | tests red |
|---|---|
| stop counting term aliases | 2 |
| stop counting literal CURIEs | 3 |
| treat an absolute IRI as a CURIE | 1 |
| make the walk shallow | 2 |
| silence the no-reason finding | 1 |
| stop reporting a stale forward declaration | 1 |

**An empty corpus is a finding, not a clean run.** With no documents every
count is zero, and since each unemitted prefix now has a reason, the check
would report *all clear* over nothing. That is `6tkl` in its most dangerous
form, and it is asserted directly.

### The sentence is corrected rather than deleted

`tabular-csvw.ts` now says the graph **BINDS** eight vocabularies, and records
that it said *"already speaks"* until today and that this was false. The
decision it exists to record — reuse rather than invent — is untouched and was
always true; what was false was the claim about emission.

## Done when

- [x] Every prefix bound in the published `@context` is counted against the nodes
      that emit it — `check:context-emission`, a gate. NOT in `kg-export`'s
      manifest as this bean assumed: that reports over the KG graph and its own
      context, while the eight-vocabulary claim is about the CONTENT context,
      whose corpus is the published `.jsonld` documents
- [x] A deliberate forward declaration carries a **declared reason**, not a
      silence — `FORWARD_DECLARED`, reason required and length-checked
- [x] `tabular-csvw.ts`'s eight-vocabulary sentence is true, or corrected —
      **corrected**: it now says BINDS rather than speaks, and records that it
      was false. Seven unemitted, not three; the earlier count measured source
      rather than documents
- [x] `skos:` is either emitted (via `lqo9`) or removed from both contexts —
      **emitted in ONE of the two**, and the distinction was missed on 2026-09-20.
      135 `skos:Concept` nodes are in the NAMESPACE document, which carries its
      own context. In the CONTENT context it is still 0, and now carries a
      recorded reason instead of a silence

Related: `ovkk` (the other direction, in-progress, PR #330), `lqo9` (the glossary
roast that surfaced this), `zzmr` (KG structure and publication), `ulqj`/`eief`
(the CSVW work whose prose carries the claim).

## Closed on re-derived evidence, 2026-09-22

Every `## Done when` item was ticked while the bean stayed open. Re-derived
against `main` at `2ce66fc`: **`check:context-emission` is declared in
`package.json` and wired into `code-quality-gates.yml`**, which is the gate
this bean's first and second items call for.

Closed by **evidence, not authorship** — `bean-coordination` §"Closing a bean
whose work has already landed".
