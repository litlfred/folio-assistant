---
# folio-assistant-ulqj
title: 'DECIDE: the data model for CSV and spreadsheets — adopt a standard, not folio-tabular-records/v1'
status: completed
type: task
priority: normal
created_at: 2026-09-20T11:57:02Z
updated_at: 2026-09-20T12:02:21Z
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

*2026-09-20* — **DECIDED by the owner: CSVW.**

> "make csvw a skill and associated tool in document ingestion. part of
> csv/excel processing is extract tabular metadata (tables, rows, headers,
> cols, data types, location on sheet, row, col, etc) as best as can. generic
> workflows, specific tools and skill depending on format"

So the standard question is closed and the two falsifiers become implementation
constraints rather than reasons to reconsider:

- `shape_source: "undetermined"` must survive — "as best as can" is the owner's
  own phrasing of the same three-state rule;
- a multi-sheet workbook maps to a `csvw:TableGroup`.

**One thing CSVW does not model, and the owner asked for it explicitly:
LOCATION ON SHEET.** CSVW describes a table's columns and datatypes; it has no
notion of "this table starts at B7 of sheet 3", because CSVW's world is a CSV
file where the table IS the file. A real workbook has tables that do not start
at A1, headers that are not row 1, and several tables on one sheet.

That is the one place an extension is unavoidable, and it must be an
ANNOTATION on CSVW rather than a replacement for it — CSVW permits additional
properties, so `fac:` terms for the anchor cell and header row keep the
standard intact while recording what it cannot say. Anything else re-invents
the thing this bean exists to avoid.

Implementation is `ulqj`'s child, not this bean: the decision is made.
