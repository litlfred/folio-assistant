---
# folio-assistant-lqo9
title: 'GLOSSARY: a coded, versioned glossary content kind in core, a defined-terms index in docs/ from every KG asset, translatable — roast first'
status: in-progress
type: feature
priority: normal
tags:
    - roast
created_at: 2026-09-20T18:03:45Z
updated_at: 2026-09-20T23:04:43Z
parent: folio-assistant-0lmb
---

Owner, 2026-09-20 (session_017PqeiS4JYySSWGAYLedmus), queued for a ROAST before anything is built:

> justthedocs docs/ rendering should include an index of all defined terms extracted from KG assets in the docs/ (e.g. a bpmn diagram swimlane has title/description). make translatable like all assets. make coded-glossary content kind that can be used in KG extraction and visualisation, re-used when looking at asset metadata. glossary can also be a content asset in a paper, document, L1 asset etc. so should be in core asset there. i want (but realistically can't require) coded and versioned glossary assets so those should be in schema. any good standards for this glossary maintenance? i know dcat? others pros cons/recommendations. what fits well with KG?

## The ask, as four separable pieces

1. **A defined-terms index in the docs/ rendering** — every KG asset that carries a title/description pair (BPMN lanes and activities, DMN decisions, roles, skills, Tool nodes, schema fields with descriptions) contributes its terms; one page indexes them with a link back to the asset.
2. **A `glossary` content kind in core** — a glossary is a content asset in its own right (a paper's glossary, a document's, an L1 asset's), so the kind lives in folio-assistant-core's schemas, not in a renderer.
3. **Coded and versioned, in the schema** — each term carries a notation (code) and the glossary carries a version; wanted, not required, so both are optional fields with a QA axis that reports coverage rather than a gate that refuses.
4. **Translatable like every asset** — labels and definitions go through the existing gettext pipeline; the term's IRI stays stable across languages.

## ROAST HELD, 2026-09-20 — measured before proposing anything

The bean's own last line said *"check what it already does before adding a second
mechanism."* It was checked, and it changes the shape of the work. **Three of the
four pieces are genuinely new; one already exists and is aimed somewhere else.**

### A glossary pipeline already exists, and it is paper-scoped

| file | what it does |
|---|---|
| `content/pipeline/build-glossary.ts` (332 ln) | walks every block **in a paper**, resolves each block's `defines[]` to chapter/section/block/Lean, emits `glossary.json` + `chapters/glossary.tex` |
| `content/pipeline/glossary-candidates.ts` (298 ln) | proposes an owner block per unowned slug, ranked by mention count |
| `content/pipeline/apply-glossary-curation.ts` | applies the human's choices |
| `ui/glossary-curator.html`, `src/routes/glossary.ts` | the human-in-the-loop half |
| `skills/folio-core/glossary-build.md` | the governing skill |

Its input is `BlockBase.defines[]`, which **is** schema-backed
(`schemas/constraints.ts:261`, `schemas/types.ts:612`). Its output is a LaTeX
chapter. So the authored half of a *paper's* glossary is built and gated.

**It is not the thing the owner asked for.** The ask is over **KG assets** — BPMN
lanes, DMN decisions, roles, skills, Tool nodes — rendered into **`docs/`**. The
existing builder reads paper blocks and writes TeX. Different corpus, different
output, different consumer. Reusing it would mean teaching a paper-scoped LaTeX
builder to walk the knowledge graph, which is the wrong direction.

### There are already TWO `GlossaryEntry` types, and they share not one field

| | `content/pipeline/build-glossary.ts` | `schemas/formalization-types.ts:175` |
|---|---|---|
| fields | `slug`, `chapter`, `chapterTitle`, `section`, `block`, `kind`, `lean` | `narrative_term`, `lean_name`, `kind`, `lean_type`, `narrative_definition`, `latex_label`, `chapter`, `mathlib_type`, `mathlib_import`, `universes`, `depends_on`, `ambiguity` |
| what it is | a **location index** — where in the paper is this slug defined | a **Lean mapping** — which Mathlib type does this narrative term mean |
| where | pipeline-local `interface` | pipeline-local `interface` |

`kind` and `chapter` appear in both under the same names meaning different things
(block kind vs Lean decl kind; chapter *directory* vs chapter *number*).

**Neither is a content kind, and neither is a Zod schema.** So the owner's piece 2
— *"make coded-glossary content kind … should be in core asset there"* — is not a
rename of an existing type. It is the first schema-backed glossary object in the
repo, and it arrives into a namespace where the name is already taken twice by
two incompatible interfaces. **Naming a third `GlossaryEntry` is the single
easiest way to make this worse.**

### The sharpest finding: `skos:` is published in the `@context` and emitted by nothing

`SKOS_NS` is declared at `schemas/jsonld.ts:90` and bound as `skos:` in the
published context at `schemas/jsonld.ts:551` **and** in the shipped
`ns/content/v1.jsonld:11`. And `schemas/tabular-csvw.ts:10` states in prose that
this graph *"already speaks eight published vocabularies — doco, deo, cito, oa,
prov, **skos**, dcterms, fhir"*.

Measured across the repository, excluding `node_modules`, `.git` and `beans/`:

| vocabulary | nodes emitting a predicate |
|---|---|
| `doco:` | 1111 |
| `dcterms:` | 4 |
| `prov:` | 2 |
| `cito:` | 2 |
| **`skos:`** | **0** |

So the claim "this graph speaks skos" is **false**, and has been since the context
was written. A consumer that dereferences the context is told to expect SKOS terms
and will never meet one — the `dh4f` shape exactly (a declaration whose consumer
scans nothing and reports a clean run), one level up in the vocabulary rather than
in a directory.

**This turns the standards recommendation from a cost into a repair.** Adopting
SKOS is not adding a ninth vocabulary; it is making the eighth true. If the owner
overturns SKOS, the honest consequence is that `skos:` comes **out** of both
contexts and out of that sentence — a bound prefix nothing emits should not
survive this bean either way.

### What the measurement settles, and what it does not

Three of the five roast questions are now answerable from evidence:

- **Extraction vs authoring** — settled by precedent, not by argument.
  `glossary-candidates.ts` already models exactly this distinction for papers: a
  *candidate* with a rank and a reason is a different object from an owned
  `defines[]` entry, and a human promotes one to the other. The KG index should
  reuse that three-state shape (`authored` / `candidate, seen in N assets` /
  `could not extract`), not invent a second one. **`could not extract` must be a
  visible third state**, per the rule this repo applies everywhere else.
- **Coverage axis: report or refuse** — report. The owner's words are *"i want
  (but realistically can't require)"*, and `types.ts:914` already records that
  `defines` was measured **absent from all four** blocks that needed it. A gate
  over a field with known-zero coverage is a gate somebody switches off.
- **One glossary per instance or per asset** — both, and SKOS already has the
  answer: `skos:ConceptScheme` per instance, `skos:Collection` per content asset,
  a concept `skos:inScheme` one and `skos:member` of many. A paper's glossary
  reuses a core term by **membership**, never by copying the definition. This is
  why the model has to be SKOS-shaped rather than a flat list.

Two remain genuinely open and are the owner's to rule on:

- **Where a term's IRI lives** — instance namespace (`ns/`) or the asset that
  first defined it. Recommendation: the **instance namespace**, because the
  owner's constraint *"moving the asset must not move the term"* is exactly what
  an asset-derived IRI cannot promise. But this is a decision with a cost — it
  means a term outlives the asset that motivated it, and something has to say
  when a term is retired.
- **Whether the existing paper glossary converges on the new kind or stays
  separate.** Converging means `build-glossary.ts` eventually emits SKOS and the
  TeX chapter becomes a projection of it; staying separate means two glossary
  mechanisms live side by side permanently, which is what the bean was told to
  avoid. Recommendation: **converge, but not in the first PR** — build the KG
  index on the new kind first, and only then re-point the paper builder, so a
  working gated pipeline is never broken for a refactor.

### What this does to the plan

1. **Do not touch `build-glossary.ts` in the first change.** It is gated, it
   works, and it serves a different corpus.
2. **The new kind gets a name that is not `GlossaryEntry`.** There are two
   already.
3. **The first deliverable is the schema + the `skos:` emission**, because that
   is what retires the false claim. The `docs/` index is second and reads it.
4. `defines[]`'s measured-zero coverage is the honest baseline for the coverage
   axis, and is reported rather than gated.

## SLICE 1 SHIPPED, 2026-09-20 — and the roast had missed a THIRD mechanism

The roast enumerated two glossary mechanisms and warned that `GlossaryEntry` was
taken twice. **There is a third, and it is the one that mattered**:
`schemas/vocabulary.ts`, 421 lines, `CLASS_GLOSSES` + `PROPERTY_GLOSSES` —
**110 authored terms**, each a `TermGloss` with a one-sentence definition and a
layer. `scripts/ns-export.ts` already emits one node per term with an `@id`, a
type, a label and a definition, and `ns:check` already gates it.

That is a glossary. The roast's own instruction — *"check what it already does
before adding a second mechanism"* — was followed for `build-glossary.ts` and
not for this, which is the failure mode the instruction exists to catch, one
level over.

**It changes the slice, and for the better.** `TermGloss` maps onto SKOS almost
term for term:

| `TermGloss` | SKOS |
|---|---|
| the key (`FshGutsNode`) | `skos:prefLabel` |
| `gloss` | `skos:definition` |
| `layer` | which `skos:ConceptScheme` it is `skos:inScheme` of |
| the prefixed name (`cat:FshGutsNode`) | `skos:notation` — **the owner's "coded", already present** |

So slice 1 is not a new schema with zero content. It is **135 real concepts in
3 concept schemes**, no new authoring burden, and `notation` answers the coded
requirement with a value that is structurally unique rather than one somebody
has to remember to type.

### The ruling turned out not to be load-bearing here

`lqo9` listed *"where does a term's IRI live"* as blocking. Sourcing slice 1
from `vocabulary.ts` **dissolves it**: those terms already live in the instance
namespaces (`bs:`, `cat:`, `fac:`), so the recommendation — instance namespace —
is the status quo rather than a choice being made. The ruling still matters for
terms extracted from BPMN lanes and DMN decisions, which is slice 2. It is not
owed before slice 1, and this bean said it was.

### What shipped

`ns-export.ts` only. Each term node gains `skos:Concept` alongside its
`rdfs:Class`/`rdf:Property` type, plus `prefLabel`, `definition`, `notation`
and `inScheme`. Three `ConceptScheme` nodes are emitted, **derived from the
terms actually present** rather than from the three layers that exist — a
scheme with no members is `dh4f` in miniature, so a `--layer bootstrap`
slice carries exactly one. In `--exact` mode the document IS its layer's
scheme and carries both types, rather than a node sharing its own `@id`.

**The punning is named rather than hidden.** A term is both a thing the graph
has instances OF and a unit of meaning a reader looks UP. Two types on one node
is sound in RDFS and OWL-Full and is what published vocabularies do; it is
**not** sound under an OWL-DL reasoner. Nothing here runs one. The line to
revisit is marked in the source, with the usual repair named.

**The RDFS facts are untouched.** `prefLabel`/`definition` restate
`label`/`comment` rather than replacing them — `skos:prefLabel` is a declared
sub-property of `rdfs:label`, so the two agreeing is the spec's expectation —
and a test asserts they cannot drift.

### Falsified by mutation, five ways

| mutation | tests red |
|---|---|
| drop `skos:Concept` from `@type` | 7 of 10 |
| drop `inScheme` | 4 |
| stop emitting scheme nodes | 3 |
| let `prefLabel` drift from `label` | 1 |
| make `notation` non-unique | 1 |

Every count is checked against **zero before anything else**, because a suite
asserting "every concept has a definition" passes perfectly over a document
with no concepts — which is precisely the state `fd6i` measured and this change
exists to make impossible. That is `6tkl`, already introduced once this evening
by a change whose own tests were meant to guard it.

### Not done, and named

`fd6i` is **widened, not closed**: re-measuring all eight bound vocabularies
rather than the five it had showed `deo:`, `oa:` and `fhir:` each emit **0**.
The eight-vocabulary sentence in `tabular-csvw.ts` is still false; this repairs
one quarter of it. Recorded there.

## Standards — what fits a knowledge graph, and what does not

| standard | what it is for | fit here |
|---|---|---|
| **SKOS** (W3C) | concept schemes: `skos:Concept`, `prefLabel`/`altLabel` per language, `definition`, `scopeNote`, `notation` (the code), `broader`/`related`, `skos:Collection` | **Recommended core.** Native RDF/JSON-LD, so it drops into the existing `@context`; `notation` is exactly "coded"; multilingual labels are first-class; the thesaurus standard ISO 25964 was designed to be carried by it. |
| **schema.org `DefinedTerm` / `DefinedTermSet`** | lightweight web vocabulary for glossary entries | **Recommended as the rendered projection** of the same nodes — the docs index emits it in JSON-LD so the page is indexable; too thin to be the authoring model (no notes, no relations). |
| **Dublin Core Terms** | provenance and versioning metadata on the asset (`dcterms:hasVersion`, `modified`, `source`, `license`) | **Use on the glossary asset itself** — already in the instance's vocabulary (who-iris records are qualified Dublin Core). |
| **FHIR `CodeSystem` / `ValueSet`** | coded, versioned terminologies with per-language designations | **The export for WHO SMART Guideline folios.** A SKOS ConceptScheme maps to a CodeSystem one-to-one (concept ↔ concept, notation ↔ code, prefLabel ↔ display, altLabel ↔ designation, Collection ↔ ValueSet). Do not author in it: it carries clinical-terminology machinery a paper never uses. |
| **DCAT** | catalogues of datasets and their distributions | **Not a term model.** Right for describing the glossary as a published dataset in a catalogue (the who-iris catalogue-by-reference already speaks this shape), wrong for defining what a term is. |
| **ISO 25964** | thesaurus construction and interoperability | The rules; SKOS is its carrier. Read for the relation semantics, do not implement separately. |
| **TBX (ISO 30042)** | terminology interchange for translators | Heavy XML; only worth an exporter if a translation vendor asks for it. gettext already covers this instance's pipeline. |
| **OWL** | formal ontologies with reasoning | Overkill; definitions here are prose, not axioms. |
| **SKOS-XL** | labels as resources, so a label can carry provenance | Reach for it only if a translated label needs its own audit trail; otherwise plain SKOS. |

**Recommendation:** SKOS for the model (with `notation` for the code and `dcterms` on the scheme for version and provenance), schema.org `DefinedTerm` as the rendered JSON-LD, FHIR CodeSystem as a generated export for guideline folios, DCAT only where the glossary is listed in a catalogue. Versioning at two levels: the scheme carries `owl:versionInfo`/`dcterms:hasVersion` and a `skos:changeNote` log; a concept carries `dcterms:modified`. Translation keeps the concept IRI stable and treats `prefLabel`/`definition` per language as the translatable strings the existing `.pot` extraction already handles for BPMN labels.

## Roast questions — three settled by measurement, two with the owner

- Extraction vs authoring: a term extracted from a BPMN lane's description is not a curated definition. Does the index show extracted candidates in a third state ("undefined, seen in N assets") distinct from authored entries?
- Where does a term's IRI live — under the instance namespace (`ns/`) or under the asset that first defined it? Moving the asset must not move the term.
- One glossary per instance or per content asset, and how does a paper's glossary reuse a core term without copying its definition?
- Coverage axis: which asset kinds MUST contribute terms for the index to be called complete, and what does "could not extract" look like?
- Does the coded/versioned field pair become a QA criterion (report) or a profile rule (refuse)? The owner's words: wanted, not required.

## Done when

- [x] The roast above is held and its answers recorded here (2026-09-20) — three of five questions settled by measurement. Of the two rulings then outstanding, **where a term's IRI lives is settled** (2026-09-21: the instance namespace, retirement in the first extracting slice); **whether the existing paper glossary converges on the new kind is still open**
- [ ] `glossary` exists as a content kind in core with optional `notation` and scheme-level version fields, validated by schema — **named something other than `GlossaryEntry`**, which is taken twice
- [ ] The docs/ rendering carries a defined-terms index built from KG assets, with extracted-vs-authored distinguished
- [ ] Labels and definitions are extracted to `.pot` like BPMN labels and render per locale
- [ ] The standards choice above is recorded as a decision (or overturned with reasons) — and either way `skos:` stops being a bound prefix that nothing emits

Related: `0lmb` (content model), `zzmr` (KG structure and publication), `bzyu` (translation pipeline), the who-iris catalogue work on PR #477, the existing `glossary-build` skill (folio-core) — check what it already does before adding a second mechanism.

## `docs-auto` — the owner's framing for where this lands, 2026-09-20

Owner (this session), reframing the ask as a HANDLER rather than a one-off page:

> in cat-harness needs to be harness/handler at `cat-harness/docs-auto/<auto-doc-type>/<path>`
> defined. which will auto-generate extracatable documentation at `<path>` sub-graph.
> extracablle = bpmn, tasks, glossary, etc. ther is a glosarry bean... this could clarify
> it lives at `cat-harness/docs-auto/glossary/<path>`

So piece 1 of this bean (*"a defined-terms index in the docs/ rendering"*) is not
its own renderer: it is **one `auto-doc-type` among several**, served by a single
handler that takes a sub-graph path and emits derived documentation for it. The
glossary index for a sub-graph lives at `cat-harness/docs-auto/glossary/<path>`.

Proposed `auto-doc-type` values, as the owner gave them:
`glossary`, `index`, `index/bpmn`, `index/dmn`, `index/skills`, `index/tasks`,
`index/processes`, `index/roles`.

**`toc` is OUT.** It was in the owner's first list and withdrawn in the same
session: *"no toc,... ther is no meanging at folio level/. (mayber later)"* — a
table of contents is a document-order notion and a folio has no single order to
take one over. Recorded here rather than dropped silently, because the next
agent reading the original list would otherwise re-add it.

Pieces 2–4 (the `glossary` content kind in core, coded + versioned in the
schema, translatable) are unchanged by this and are still this bean's.

**Not started.** Queued behind the who-iris ingestion work; the roast above still
holds and still gates any build.

## SLICE 2 — swimlane terms. Scoped 2026-09-21, prerequisites landed

Issue #596 names the source in the owner's own words: *"a bpmn diagram
swimlane has title/description"*. That input now exists and is gated —
**157 of 157 task-containing lanes carry a `<bpmn:documentation>`** (bean
`sqtq`, PR #782), with `check:lane-documentation` in the gate set so it stays
that way.

### The mapping is THREE predicates, not two

Measuring before writing found that 156 of the 157 lanes already resolve to a
role carrying a `description`. So a persona blurb per lane would have
duplicated `roles.json` — twelve times over for the lane named `Agent`.

| SKOS | source | answers |
|---|---|---|
| `prefLabel` | the lane's `name` | what is this called |
| `definition` | the **role's** `description` | who is this persona, in every diagram |
| `scopeNote` | the lane's `<bpmn:documentation>` | what is this lane accountable for **in this process** |

The owner's *"name, documentation → glossary"* holds — both feed it, at
different predicates. The lane text is SUPPOSED to differ per diagram; that is
its content, not drift.

### Owner's ruling, 2026-09-21: its own document

`ns-export.ts` already unions TWO sources — the `termIri("Name")` scan and the
registry-minted terms — with a test asserting the union is not redundant. So a
third source was *structurally* fine, and that is why it was a question rather
than a constraint.

The objection is editorial: a persona like `Board renderer` is a `skos:Concept`
but **not** an `rdfs:Class`, and folding personas in would make one document
answer two different questions — "what can the code mint" and "what does this
word mean to a reader" — falsifying its own docstring.

So: **a separate glossary document, in the same instance namespace.** Ruling A
is untouched; `conceptSchemeIri` and the layer model do not change. Cost,
stated: a second generator and a second staleness check.

### `laneBinding` is what makes the honest case expressible

Bean `ug4r` (PR #800) gives five answers where there were two. A lane whose
performer varies BY DESIGN emits a term with a `scopeNote` and **no**
`definition` — which is true — instead of being indistinguishable from a lane
nobody got round to binding. Without it the extractor would have had to guess,
and a guessed definition-less term reads as a defect.

### Retirement, per the earlier ruling

A term whose defining lane is gone becomes `deprecated`, **reported and never
deleted** — `deletion-requires-confirmation`, and the same reason a scrapped
bean is not a deleted one: retirement and accident must not look alike.

### Not started

Implementation waits on `ug4r` merging, so PR #800 stays one reviewable
subject. Nothing here is built.
