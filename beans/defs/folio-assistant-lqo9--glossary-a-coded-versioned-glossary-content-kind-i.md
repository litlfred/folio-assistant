---
# folio-assistant-lqo9
title: 'GLOSSARY: a coded, versioned glossary content kind in core, a defined-terms index in docs/ from every KG asset, translatable — roast first'
status: todo
type: feature
priority: normal
tags:
    - roast
created_at: 2026-09-20T18:03:45Z
updated_at: 2026-09-20T18:03:45Z
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

- [x] The roast above is held and its answers recorded here (2026-09-20) — three of five questions settled by measurement; **two rulings outstanding**: where a term's IRI lives, and whether the existing paper glossary converges on the new kind
- [ ] `glossary` exists as a content kind in core with optional `notation` and scheme-level version fields, validated by schema — **named something other than `GlossaryEntry`**, which is taken twice
- [ ] The docs/ rendering carries a defined-terms index built from KG assets, with extracted-vs-authored distinguished
- [ ] Labels and definitions are extracted to `.pot` like BPMN labels and render per locale
- [ ] The standards choice above is recorded as a decision (or overturned with reasons) — and either way `skos:` stops being a bound prefix that nothing emits

Related: `0lmb` (content model), `zzmr` (KG structure and publication), `bzyu` (translation pipeline), the who-iris catalogue work on PR #477, the existing `glossary-build` skill (folio-core) — check what it already does before adding a second mechanism.
