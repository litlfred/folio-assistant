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
      survives it — **the third state is already safe**: `yh6u` (#1078) made
      the record real JSON-LD with `narrative`/`sheets` typed `@type: "@json"`,
      so its nulls survive expansion. What is still open is MIGRATION proper,
      meaning CSVW replacing v1, which waits on the extractors. Read as "v1's
      format is broken", this line sends you to a defect that no longer
      exists — it did, on 2026-09-23 (bean `nbjv`)
- [ ] this unblocks `p67i`'s manifest: what a sheet IS in the graph is answered

## Not this bean

The narrative description of a dataset. That needs an author and there is no
tabular source in the corpus yet (`p67i`).

*2026-09-20* — Built to the strawperson's defaults, all four accepted.

`fac:` namespace · fail CI on an expired stub, report an outstanding one ·
model + skill + both stubs + QA axis · infer datatypes, mark `undetermined`
when unsure.

**Shipped:** `csvw:` in the published `@context` beside the other eight
prefixes; `schemas/tabular-csvw.ts`; `skills/folio-core/tabular-metadata.md`;
`tabular-csv` and `tabular-xlsx` declared as stubs in `tools/index.ts`; and
`bun run check:tabular-stubs`, wired into the gate set (52 fast / 55 all).

**No extractor ships.** That was the instruction, and the QA axis is what makes
it safe: a stub is `not-derivable` naming its tool, a half-stub fails schema
validation, and an expired stub fails CI. The stubbed set is READ from
`install: { none: true }` on the tool declarations rather than restated — the
`transcript.json` probe is why.

Ten mutations, each caught by a named test. Two needed the test strengthened
first: `install.none` ignored still passed until a test asserted a RUNNABLE
tool is outside the set, and my extent refine compared two conditions for
equality, so `{rows: 8, columns: null, source: "measured"}` — the exact
half-known extent the rule refuses — validated. Caught by the test written for
it, not by review.

**Three of this repo's own gates caught things I got wrong**, which is the
system working: a skill with no published reference page and no manifest
entry; an unassigned module; and a WRONG-DIRECTION EDGE. I had filed
`check-tabular-stubs.ts` with the harness because it reads the tool graph, and
`--edges` reported a harness module importing core's schema. The table's own
test settles it — does it need a folio to have anything to do? It scans
`library/`. It is core, and core may import harness.

## Still open

- the extractors themselves (deliberately absent);
- migrating `folio-tabular-records/v1` — both models now exist side by side;
- what a sheet IS in the document graph (`0lmb`), which still blocks `p67i`'s
  manifest.
