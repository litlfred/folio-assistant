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

1. **Fetch the DAK** from WHO IRIS with
   `bun run folio-assistant-core/scripts/fetch-dspace-item.ts <handle URL> --out uploads`.
   It writes the PDF, the item's Dublin Core record (`folio-dublin-core/v1`)
   and an `intake.json` whose licence is the record's `dc.rights` — stated only
   when the repository states it.
2. **Ingest it**: `bun run ingest uploads/<doc_id>/<doc_id>.pdf --library <lib>`.
   A WHO PDF with no outline goes to `pdf-structure`, which keeps its inferred
   contents only if they pass the trust tests (issue #2302), else pages.
   Component 1 is found by its headings either way.
3. **Extract Component 1**:
   `bun run smart-base/scripts/extract-dak-l1-references.ts --entry library/<doc_id>`.
   It reports how many citations it read, which it resolved, and which rest on
   the printed number alone. The DAK repository's `dak.json` `canonicalUrl` is
   the namespace its citations and reference entries are minted under.
4. **Fetch and ingest every cited source with a retrievable PDF** — steps 1
   and 2 for each IRIS handle a reference carries — then **run step 3 again
   with `--record-context`**: each held source's intake gets §1.2's context
   record, and a reference now resolves to the source's own description.
5. **For each held source that is L1, run the L1 step**:
   `bun run smart-base/scripts/l1-specialise.ts --entry library/<doc_id>`.
   It writes the source's publication, sections and printed elements beside
   its entry, each a specialisation of the library node it came from. A
   source that is not L1 gets no L1 graph: its library entry is its only
   representation, and a DAK reference to it resolves to that entry.
6. **Validate**: `--validate-zod <smart-base checkout>` on either script runs
   the Zod validator in smart-base `kg/`, which checks L1 3.0 and the
   `l1-library` layer, property VALUES included. WHO smart-kg's own
   `tools/validate.mjs` knows L1 only, so it cannot check a document that uses
   the library layer.
7. **Leave fidelity to a person.** The run lists each citation whose words
   differ from its reference title. Someone opens the DAK page and the source
   and confirms it; nothing marks that check passed automatically.

## What the graphs hold

`smart-kg-l1-dak-references.json`, beside the DAK's entry:

| node | from | derivation |
|---|---|---|
| `citation` | each printed `(n)` in §1.2, text verbatim; §1.1's unnumbered source, unresolved | derived |
| `reference-entry` | the reference a number names | derived |
| `publication` | what an entry resolves to when the source is L1 — the held source's Dublin Core, or the reference's own words | inferred, or decided when declared |
| `library-node` | what an entry resolves to when the library holds the source and it is **not** L1 | derived |

`citation numberedAs reference-entry` (derived); `reference-entry resolvesTo
publication | library-node` (inferred).

`smart-kg-l1-library.json`, beside each L1 source's entry: `publication`,
`publication-section` (one per library section, front matter excepted, with
the ingest's confidence in its note) and `publication-element` (each figure,
table and box the ingest's figure reader found), joined by `contains`, and each
`specializationOf` its `library-node`. Section IRIs use the number as the
contents page **prints** it (`Annex 1`, `Section 2`), so an annex does not
collide with a chapter of the same number.

**A citation resolves by its printed number**, into the numbered list that
holds every cited number with the most title agreement — a DAK has several
numbered lists, and choosing one is the judgement, recorded on every edge.
Title agreement is corroboration: a card often *describes* its source rather
than naming it, so low agreement is flagged for step 7, not treated as a miss.

**publicationType comes from a declaration or the title's own words**
(`summary tables`, `guidance`, `position paper`, `classification`). A
guideline's subtype turns on its GRC history, which a title does not carry,
and a data portal has no type at all; neither is forced into the nearest code.

## Where the files go

Both graphs are written beside their entries; `smart-kg-l1.json` is the
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
