---
# folio-assistant-eief
title: 'CSVW skill + ingestion tools: tabular metadata as far as it can be determined'
status: todo
type: feature
priority: normal
created_at: 2026-09-20T12:02:21Z
updated_at: 2026-09-20T12:02:21Z
parent: folio-assistant-slw1
---

The owner's decision on `ulqj` is CSVW. This is the build.

> "make csvw a skill and associated tool in document ingestion. part of
> csv/excel processing is extract tabular metadata (tables, rows, headers,
> cols, data types, location on sheet, row, col, etc) as best as can. generic
> workflows, specific tools and skill depending on format"

## The shape the owner asked for

**Generic workflow, format-specific tools, one skill.** That is the same axis
`content-profiles` already draws: the *process* of deriving tabular metadata
does not change between CSV and XLSX, while *how you read the bytes* does.
A CSV has one table and no cells outside it; a workbook has sheets, several
tables per sheet, and a table that may start anywhere.

## What must be extracted, and the honest limit on each

Tables, rows, headers, columns, **data types**, and **location on sheet**
(anchor cell, header row, row/column extent) — **"as best as can"**, which is
the owner's own phrasing of this repository's three-state rule. Every field
gets a determined value or an explicit undetermined with a reason; none gets a
default. `shape_source: "undetermined"` already does this for shape and must
survive the migration rather than be flattened.

## The one place CSVW is not enough

CSVW models a table's columns and their datatypes. It has **no** notion of
*where* a table sits, because in CSVW the table IS the file. Everything the
owner listed after "data types" — location on sheet, row, col — is outside it.

So: annotate, never replace. CSVW permits additional properties; `fac:` terms
carry the anchor cell and header row while `csvw:` carries structure and type.
A reader with a CSVW parser still gets a valid table description, which is the
whole reason for adopting a standard.

## Done when

- [ ] `csvw:` is in the `@context`, beside doco/deo/cito/oa/prov/skos/dcterms/fhir
- [ ] a skill governs tabular metadata extraction — what is determinable per
      format, and what undetermined means for each field
- [ ] CSV and XLSX each have their own tool; the workflow that calls them is
      shared
- [ ] location-on-sheet is recorded as an annotation ON CSVW, with a test that
      a CSVW-only reader still parses the output
- [ ] `folio-tabular-records/v1` is migrated, and the undetermined third state
      survives it
- [ ] this unblocks `p67i`'s manifest: what a sheet IS in the graph is answered

## Not this bean

The narrative description of a dataset. That needs an author and there is no
tabular source in the corpus yet (`p67i`).
