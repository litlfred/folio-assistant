---
# folio-assistant-63q4
$schema: bean/1.0.0
title: 'Bibliography: Reference KG nodes, a path-limited bibliography viewer (like the glossary), exports in BibTeX / CSL-JSON / RIS / Dublin Core, per asset and per subgraph'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-14T17:45:00Z
updated_at: 2026-10-14T18:15:00Z
---

## The ask, owner 2026-10-14 (verbatim)

> what is the general bibliography support? look at who-iris - its dublin core recores are a basis for a bibliography - there should be abibliogrpahy viewere that allows view/export in multiple formats of bib items in the folio. those citations be from library/ contents or extracted from a paper reference in the library or fiolo/. you should also be able to export biblio refernce fo a single asset/paper in folio/ or lbibary/. shuold also be able to view (and later add) things in biblio not in library aets (like dublin core records, they are own nodes)
>
> biblio viewer should work similar to glossary viwere, .... use path limit to subgraphs and splecific asssets

Owner ruling on qou, same day: **"1 + 2"**. Keep CSL-JSON as the source and generate one node per entry (1). Also split `references.ts` into one authored CSL-JSON file per entry in a declared directory (2). qou's half is bean `qou-l7pj`.

## What is true today (survey 2026-10-14, session_01QHu5UpKG62GzKEgprQkzDh)

- **The only bibliography store is a folio's CSL-JSON module** (`content/schema/references.ts` in qou: 915 entries, each with a `library` link to the held copy). It is injected through cat-harness-tools `pipeline/references-registry-di.ts`.
  - Tools: `citations.ts` (`\cite` parse), `validate-bib.ts`, `validate-references.ts`, `bib-qa.ts`, `export-bibtex.ts` (CSL→BibTeX, used for LaTeX/PDF), and `export-json.ts` (per-chapter `bibliography`).
  - core `adapters/document/tools/bib.ts` wraps these as the MCP tools `bib_validate`, `references_validate` and `bib_export`.
  - `export-bibtex.ts` hardcodes "Quantum Observable Universe" in its header (qou bean `8tlx`).
- **Citations point at nothing.**
  - `resolveReferenceKey(key)` returns `references/${key}` (cat-harness `schemas/jsonld.ts:513`). `gen-block-jsonld` maps a block's `cites` with it, as `cito:cites`.
  - No node is ever emitted at `references/<key>`, so every citation IRI dangles.
  - `citationsToHtml` (core `build-document-site.ts:444`) renders `[a, b]` with no link.
  - The JSON-LD context has `cito`, `dcterms` and `doco`, but not `bibo` or `fabio`.
- **Papers have no bibliography field.** `PaperSchema` (cat-harness `schemas/constraints.ts:574`) has none. Blocks carry `cites[]`, and the `cites-resolve` rule checks them.
- **who-iris Dublin Core records** are `catalogue/records/<id>.dc.json` (`folio-dublin-core/v1`: `fields[]` of `{schema:"dc", element, qualifier?, values[]}`; schema in core `schemas/dublin-core.ts`).
  - They are not KG nodes: no `@id`/`@type`.
  - The generated `site/dublin-core/*.dc.jsonld` have `@id` (the Handle) and dcterms properties but no `@type`. `dublinCoreToJsonLd` gives `dspace:Item`; `dublinCoreToDcterms` gives none.
- **Library items** (`library/<doc>/manifest.jsonld`, `cat-harness:SourceDocument`) carry title, arXiv and DOI, but no authors (those sit only in `structure.json` as `authors_raw`) and no DC fields.
  - A paper's reference list is one prose block, `sec-NNN-references.md`, with no per-entry nodes.
- **Exports:** BibTeX yes. CSL-JSON only as source. RIS none. DC XML/JSON-LD for who-iris records (bean `7eak`).
- **Glossary viewer**, the model to follow:
  - Declared as a visualiser `{id:"glossary", renderedBy:"glossary-page", covers:["glossary"]}` (`folio-assistant-core.json:303`), plus a Tool node `renders:["glossary"]`.
  - Routes come from `schemas/visualiser-route.ts`: `<locale>/<harness>/<visualiser>/[<sub-graph>/[<path>]]`, via `declaredRoute()`, gated by `check:visualiser-routes`.
  - Data comes from `collect()`, scanning declared `glossary` directories. The output is SKOS JSON-LD plus static pages: a `<dl>` per letter, an A–Z nav, an inline filter and anchors. There are no query parameters.

## Proposal

1. **A Reference node type** (definition in cat-harness, beside `jsonld.ts`): a `folio-reference/v1` node at `references/<key>`, so the IRIs `resolveReferenceKey` already writes resolve.
   - **Body:** the CSL-JSON item, the authoritative citation data maths needs (volume, issue, page, series, DOI).
   - **JSON-LD context:**
     - maps the CSL fields to `dcterms:` / `bibo:` / `fabio:` (add those prefixes), so every node also reads as Dublin Core;
     - `@type` is `fabio:Work` plus a `bibo:` class from the CSL `type`.
   - **Links:**
     - `library` becomes `dcterms:hasVersion` → the held asset's manifest node;
     - `derivedFrom` points to the paper a reference was extracted from.
2. **Sources, all producing the same node type:**
   - (a) A folio's CSL-JSON: qou's `references.ts` now, its per-entry files after `qou-l7pj`.
   - (b) who-iris DC records, mapped DC → CSL (title, creator→author, date.issued→issued, identifier.isbn/uri/govdoc, publisher, type) by a projection in core beside `dublinCoreToJsonLd`.
   - (c) Library items: manifest plus `authors_raw`, arXiv and DOI.
   - (d) Extracted reference lists: a paper's `sec-*-references.md` split into one candidate node per entry, marked `provenance: extracted` with `derivedFrom`.
   - (e) Standalone reference nodes that are not library assets: viewable now, addable later through the ✍ editor or a form.
3. **A declared `bibliography` visualiser**, like the glossary: a Tool `bibliography-page` with `renders:["bibliography"]`, `covers` the declared reference directories, routed by `declaredRoute`.
   - **Path limit:** full KG at `…/bibliography/`; one subgraph at `…/bibliography/<sub-graph>/`; one asset or paper at `…/bibliography/<sub-graph>/<path>`. The last shows that paper's own reference plus everything its blocks `cite`.
   - **Page:** a static list sorted by author/year with an inline filter, anchors per key, and per-entry links to the library asset, DOI and arXiv.
4. **Exports** (Tool plus static files beside each page): BibTeX (`export-bibtex`, de-hardcoded), CSL-JSON, RIS, Dublin Core XML/JSON-LD (bean `7eak`'s renderers). Each is produced for the whole KG, a subgraph, and a single asset/paper.
5. **Checks:**
   - `\cite` keys resolve to nodes, as a warning per the 4dx7 rule. The sci checker already reads keys via `citeKeysFromReferenceNodes` (folio-assistant-sci#27).
   - `citationsToHtml` links `[key]` to the node's anchor in the bibliography viewer.

## Layering (corrected 2026-10-14, when building it)

Core's AGENTS.md rule decides it: *a schema describing what a folio HOLDS or where it CAME FROM belongs in core*, and cat-harness-tools may not import core. So the Reference schema, the DC→Reference projection, the generator and the viewer are **folio-assistant-core**'s, beside `dublin-core.ts` and `glossary-page.ts`. cat-harness-tools contributes only the pure BibTeX formatter (split out of the `export-bibtex` script). The original layering below is kept for the record.

## Progress
- [x] **merged** cat-harness-tools#214: `pipeline/bibtex-format.ts`, pure `cslToBibtex`. Byte-identical to `export-bibtex` over all 914 qou references.
- [x] **merged** folio-assistant-core#87: `schemas/reference.ts` (`folio-reference/v1`, `referenceToJsonLd` as dcterms/bibo/fabio, `dublinCoreToReference`, `toCslJson`/`toBibtex`/`toRis`/`toJsonLdGraph`), the `references` typology and its validator.
- [x] **merged** folio-assistant-core#88: `scripts/bibliography-page.ts`, the `bibliography-page` Tool, and the `bibliography` visualiser (`coversKinds: [references, catalogue]`, per-directory sub-graphs). It reads every `references` and `catalogue` directory; on the current index it lists who-iris's three items, each with its held library copy. Pages: whole KG plus one per sub-graph, each with `references.{bib,csl.json,ris,jsonld}`. Each entry has its own BibTeX/RIS/CSL-JSON download.
- [ ] `check:bibliography`: waits on cat-harness#194 (B1). The pages read other instances, so they are built at publish, not committed. The gate is `publish-check.ts bibliography:page` once #194 lists `bibliography:page` as a writer of `docs/folio-assistant-core/`.

## Layering (as first proposed)

- **cat-harness:** the node schema, the context prefixes, and the visualiser declaration shape (exists).
- **cat-harness-tools:** generator, viewer, exporters, de-hardcoded `export-bibtex`.
- **folio-assistant-core:** the DC→Reference projection; the bib MCP tools gain view and export per path.
- **folio-assistant-sci:** maths profile (arXiv/MR/zbMATH identifiers, `\cite` checks, reference-list extraction for papers).
- **who-iris:** declares its catalogue as a source of reference nodes.
- **qou:** `qou-l7pj`.

## Todo
- [ ] `folio-reference/v1` schema + context prefixes (`bibo`, `fabio`) + validator node (cat-harness)
- [ ] `gen-reference-jsonld`: CSL-JSON (module or per-entry files) → `references/<key>.jsonld` (cat-harness-tools)
- [ ] DC → Reference projection; who-iris declares its records as a reference source (core, who-iris)
- [ ] Library items → Reference nodes (manifest + `authors_raw`); the `8iqc` bibliographic-missing findings feed this
- [ ] Reference-list extraction for library papers: candidate nodes, `provenance: extracted` (sci profile first)
- [ ] `bibliography-page` Tool + visualiser declaration, routed full / subgraph / asset (cat-harness-tools, core)
- [ ] Exports: BibTeX (de-hardcoded), CSL-JSON, RIS, DC XML/JSON-LD; whole, subgraph, single asset
- [ ] `citationsToHtml` links citations to the viewer; `cites-resolve` reads the nodes
- [ ] Later: add a reference from the viewer (✍ editor or form) as a standalone node

## Related
- `4dx7` (sci cite-key warnings, folio-assistant-sci#25/#27), `7eak` (DC renderings), `7deg` (DC in core), `8iqc` (library bibliographic QA), qou `8tlx` (bib migration plan), `qou-l7pj` (qou per-entry split).
