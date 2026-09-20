---
# folio-assistant-ulqj
title: 'DECIDE: the data model for CSV and spreadsheets — adopt a standard, not folio-tabular-records/v1'
status: todo
type: task
priority: normal
created_at: 2026-09-20T11:57:02Z
updated_at: 2026-09-20T11:57:02Z
parent: folio-assistant-0lmb
---

## The ask, in the owner's words

> what is best data model for csv/sheets. don't want full excel complexity,
> need markdownable, transferable, importable, maintainable. **not new/custom
> thing.**

## Why this is open: we already built the custom thing

`schemas/tabular-records.ts` defines `folio-tabular-records/v1` — `sheets[]`
with `name`, `headers[]`, `rows`, `columns`, `shape_source`. It works and it is
gated, but it is **ours**. Nothing else reads it, no tool imports it, and every
consumer we ever want has to be taught it.

That is the opposite of how the rest of this graph is built. The `@context`
declares **doco, deo, cito, oa, prov, skos, dcterms, fhir** — eight
vocabularies, every one published by somebody else. Measured 2026-09-20:
**zero** of them are folio inventions. The tabular side is the exception.

## What the decision actually blocks

`p67i`'s remaining Done-when is *"manifest.jsonld carries a tabular record per
sheet"*. `gen-library-jsonld.ts` takes `structure.json` + `sections/*.md` and
emits `contains` → sections. A tabular entry has sheets, not sections, so the
manifest cannot be written until somebody says what a sheet IS in the graph.
Picking a standard answers that question rather than deferring it again.

## Candidates, against the owner's four words

| | markdownable | transferable | importable | maintainable |
|---|---|---|---|---|
| **CSVW** (W3C Rec, `csvw:`) | data stays CSV → trivial | JSON-LD, RDF-mappable | W3C-standard parsers | a Recommendation, not a project |
| **Frictionless Table Schema** | data stays CSV | plain JSON | pandas / R / many | active spec, wide open-data use |
| **DCAT + dcterms** | n/a — catalogue level | already in our `@context` | catalogue tools | W3C Rec |
| **schema.org `Dataset`** | n/a — coarse | universally indexed | search engines | stable |
| *(status quo)* `folio-tabular-records/v1` | yes | **no** | **no** | ours to carry |

**CSVW looks like the answer and should still be checked rather than assumed.**
It is a W3C Recommendation, it is JSON-LD — which this graph already is — and
it models exactly table → column → datatype without importing a formula
engine, merged cells, or anything else that makes a spreadsheet a spreadsheet.
`dcterms` is already in our `@context` and covers title/description/created,
so the descriptive half needs nothing new at all.

The pairing to evaluate: **CSVW for the table/column structure, `dcterms` for
description, DCAT only if a catalogue level is ever wanted.** The CSV file
itself stays the data — which is what makes it markdownable and importable, and
is a property no metadata choice can take away.

## What would falsify that

- CSVW's column model may be heavier than a header list needs, and an entry
  whose headers are all we could determine must still be expressible. Our
  `shape_source: "undetermined"` third state has to survive the move, or the
  migration would trade a custom schema for a lossy standard one.
- A multi-sheet workbook is several CSVW tables in a `TableGroup`. Check that
  reads naturally as one library entry before committing.

## Done when

- [ ] one standard is chosen, with the four words tested against it rather than
      asserted
- [ ] a worked example of THIS corpus's shape in that standard — including the
      undetermined case
- [ ] `folio-tabular-records/v1` is migrated, or the reason to keep it is
      written down and is better than inertia
- [ ] what a sheet is in the graph is settled, which unblocks `p67i`'s manifest

## Not this bean

Implementing the manifest. That waits on the answer here, and doing it first
would bake in whichever shape got typed first.
