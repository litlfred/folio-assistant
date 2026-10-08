---
name: dak-l1-library
description: >
  Build a DAK's library from the L1 sources its Component 1 cites, and the L1
  knowledge graph that records them. Read when starting or extending a DAK
  library, when a DAK's guidance changes, and before writing any L1 graph for a
  DAK. Covers fetching a cited WHO IRIS item, ingesting it, deciding whether it
  is L1 (declared > context > inferred), extracting the Component 1 graph, the
  L1 graph of each L1 source as a specialisation of its library entry, and the
  layering rule: the library is upstream of L1.
---

# dak-l1-library

> Skill id: `dak-l1-library` · Package: `authoring-who-smart-guidelines` ·
> Named by `l2-dak-authoring.bpmn` step **Build the L1 library from
> Component 1**, in the `Business analyst` lane. Bean `5uyl`.

**Every library built for a DAK starts from the DAK's own Component 1.**
Component 1 — "Health interventions and recommendations" — is where a DAK
says which WHO guidelines and guidance it operationalises: §1.1 lists the
interventions, §1.2 names the sources, each with a printed `(n)` into the
DAK's reference list. Those sources are the DAK's L1. A library that holds the
DAK but not what Component 1 cites cannot answer the question an L1 graph
exists for: *which recommendation does this decision rule implement?*

## The layering rule (owner, 2026-10-07)

> *"Library is upstream to L1. L1 can point upstream but not downstream."*

Every layer points only upstream: L3 → L2 → L1 → **library**. An L1 node may
name the library node it was read from; nothing in the library names L1. So an
L1 document's publication, sections and elements are **specialisations** of
its library entry, its sections and its blocks (`prov:specializationOf`), and
L1 inherits whatever sectioning the ingest produced — an outline, the
consensus contents of issue #2302, or pages. The schema is smart-base's
`l1-library` layer (`kg/src/l1-library.ts` in litlfred/smart-base), which
imports smart-kg L1 3.0 unchanged.

## L1 or not — three sources, one precedence

A document is L1 when it is WHO guideline content: a guideline, implementation
guidance, a summary table, a position paper, a classification. A DAK is **not**
(it is L2); neither is a technical specification. The answer is recorded on the
document's `intake.json` as a `classifications[]` entry (scheme
`https://smart.who.int/kg/layer`, code `l1`), from up to three sources:

| source | written by | smart-kg derivation |
|---|---|---|
| `declared` | a person, with `by` and `at` | `decided` |
| `context` | this step: §1.2 introduces every card as guidance the DAK draws on (`--record-context`) | — the publication stays `inferred` |
| `inferred` | `l1-membership.ts` from the IRIS Dublin Core record (series, title words) | `inferred` |

**declared > context > inferred.** A lower record that disagrees is reported on
every run, never dropped — the immunizations DAK's §1.2 cites DDCC (28), so
context says L1, and the owner's declaration says it is not. No record at all is
*undetermined*: the L1 step does nothing and says what to record.

## The pattern

**The DAK is library-only.** Owner, 2026-10-08: *"since its a DAK its not L1
so no L1 KG here. but do go through chapter 1 and pick all L1 references …
and make L1 graphs for them by ingesting each one of them individually"*.
Reading Component 1 is how the L1 sources are FOUND; it produces no graph of
its own.

1. **Fetch the DAK** from WHO IRIS with
   `bun run folio-assistant-core/scripts/fetch-dspace-item.ts <handle URL> --out uploads`.
   It writes the PDF, the item's Dublin Core record (`folio-dublin-core/v1`)
   and an `intake.json` whose licence is the record's `dc.rights` — stated only
   when the repository states it.
2. **Ingest it**: `bun run cat ingest uploads/<doc_id>/<doc_id>.pdf --library <lib>`.
   A WHO PDF with no outline goes to `pdf-structure`, which keeps its inferred
   contents only if they pass the trust tests (issue #2302), else pages.
3. **Read Component 1**:
   `bun run smart-base/scripts/extract-dak-l1-references.ts --entry library/<doc_id> --context-only`.
   It lists §1.2's citations and the reference each printed number names,
   with its URL, and says which rest on the printed number alone. Those
   references are the fetch list.
4. **Fetch every L1 source, one by one, by where it lives:**
   - an IRIS or PAHO IRIS handle → `fetch-dspace-item.ts`;
   - a who.int item page (`/publications/m/item/…`) →
     `bun run folio-assistant-core/scripts/fetch-who-publication.ts <URL> --out uploads`,
     which reads the page's title, date, type, overview, page count and
     copyright into the Dublin Core record and takes its one PDF;
   - a reference whose URL is a **listing** (the summary-tables page lists
     Tables 1–4, each cited by its own card) → fetch each listed item, and
     record on each intake how it was reached.

   A source that is not a publication (a data portal, a blank reporting
   form) is not fetched; say so. Then ingest each (step 2).
5. **Record the context decision**: run step 3 again with `--record-context`.
   Each held source's intake gets §1.2's `context` classification, found by
   handle or by its record's `dc.identifier.uri`. A declaration outranks it,
   and every run reports the disagreement.
6. **For each held source that is L1, run the L1 step**:
   `bun run smart-base/scripts/l1-specialise.ts --entry library/<doc_id> --validate-zod <smart-base checkout>`.
   It writes `smart-kg-l1-library.jsonld` beside the entry: the source's
   publication, sections and printed elements, each a specialisation of the
   library node it came from. A source that is not L1 gets no L1 graph; its
   library entry is its only representation.
7. **Check the edition.** A who.int page serves the CURRENT edition, which may
   be newer than the one the DAK cites ("updated in 2024" against a
   1 December 2025 table). Note it on the intake; do not silently treat them
   as one.
8. **Leave fidelity to a person.** The run lists each citation whose words
   differ from its reference title. Someone opens the DAK page and the source
   and confirms it; nothing marks that check passed automatically.

## What an L1 graph holds

`smart-kg-l1-library.jsonld`, beside each L1 source's entry: `publication`,
`publication-section` (one per library section, front matter excepted, with
the ingest's confidence in its note) and `publication-element` (each figure,
table and box the ingest's figure reader found), joined by `contains`, and each
`specializationOf` its `library-node`. Section IRIs use the number as the
contents page **prints** it (`Annex 1`, `Section 2`), so an annex does not
collide with a chapter of the same number; a heading printed many times
("Analysis" under every chapter) takes its position among its namesakes. A
publication with no ISBN or handle is identified by its page URL.

**It is JSON-LD, and it survives as RDF.** Its `@context` is
`http://smart.who.int/kg/l1-library.context.jsonld` — the layer's identity,
never fetched at run time. litlfred/smart-base `kg/` generates that context
from the same Zod source as the FHIR models and serves it through
`src/loader.ts`; expand a graph with jsonld.js and that `documentLoader`.
smart-kg's own L1 context drops every node class and property name and any
predicate it does not know; the library context fixes all three (`@vocab`,
`properties` as `@nest` with Dublin Core terms, predicates by declared IRI).

**A citation resolves by its printed number**, into the numbered list that
holds every cited number with the most title agreement — a DAK has several
numbered lists, and choosing one is the judgement. Title agreement is
corroboration: a card often *describes* its source rather than naming it, so
low agreement is flagged for step 8, not treated as a miss.

**publicationType comes from a declaration or the title's own words**
(`summary tables`, `guidance`, `position paper`, `classification`). A
guideline's subtype turns on its GRC history, which a title does not carry,
and a data portal has no type at all; neither is forced into the nearest code.

## Where the files go

Each L1 graph is written beside its entry; `smart-kg-l1.json` is the
recommendation extractor's (`extract-smart-kg-l1.ts`). The DAK repository
holds the library: `library/<doc_id>/` for each entry, and
`uploads/<doc_id>/intake.json` plus the Dublin Core record for each fetched
item. The PDFs themselves are pinned by sha256 and not committed.

## What it cannot do yet

- **Element types the library does not extract**: table rows, footnotes,
  charts, images, flowcharts, lists. L1 3.0 defines all nine; the L1 step
  emits the three the ingest finds and names the other six in the
  publication's note.
- **Recommendations** in an L1 source are `extract-smart-kg-l1.ts`'s, which
  still writes L1 1.0.
- **The position papers behind a summary table.** (29) in the immunizations
  DAK is the routine-immunization summary tables, which cite the WHO vaccine
  position papers; following them is a fetch per paper, not yet automated.
- **Sources outside WHO IRIS.** `fetch-dspace-item.ts` speaks DSpace 7; a
  who.int page, a PAHO IRIS item behind a different network policy, or a
  spreadsheet is recorded with its URL and reported, not fetched.

## Schemas this rests on

- L1 3.0 and the `l1-library` layer: `kg/` in litlfred/smart-base — Zod,
  migrated from WHO smart-kg main `3f5e477`, generating the `KG*` logical
  models, code systems and value sets;
- IRIs: `smart-base/scripts/l1-kgid.ts`, smart-kg's `kgid.mjs` as tested;
- the Dublin Core record: `folio-assistant-core/schemas/dublin-core.ts`;
- the intake, its licence and its classifications: `cat-harness/schemas/intake.ts`,
  `cat-harness/schemas/source-licence.ts`.
