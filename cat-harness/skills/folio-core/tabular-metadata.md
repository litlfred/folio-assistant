---
name: tabular-metadata
description: >
  Extract tabular metadata from a CSV or spreadsheet as CSVW — tables, rows,
  headers, columns, datatypes and location on sheet — recording every field as
  determined or explicitly undetermined. Read before touching a tabular
  ingest arm, adding a format, or deciding what a sheet is in the graph.
allowed-tools: Read Grep Glob Bash
---

# Tabular metadata — CSVW, annotated, and honest about what it could not read

**The model is CSVW and nothing custom.** Bean `ulqj`, decided by the owner:
*"not new/custom thing."* This graph already speaks doco, deo, cito, oa, prov,
skos, dcterms and fhir — eight published vocabularies, zero folio inventions.
`folio-tabular-records/v1` was the one exception and is being retired.

CSVW is a W3C Recommendation, it is already JSON-LD, and it models
**table → column → datatype** and nothing else. That last part is the feature:
*"no full Excel complexity"* is a property of the vocabulary, not a rule anyone
has to remember. CSVW cannot express a formula, a merged cell or a fill colour,
so nobody can add one by accident.

## The one thing CSVW cannot say, and the only place we extend it

**Where the table is.** In CSVW the table *is* the file, so a CSVW document has
no way to say *"this table starts at B7 of sheet 3"*. A real workbook breaks
that assumption three ways:

- a table that does not start at A1,
- a header row that is not row 1,
- several tables on one sheet.

So three `fac:` terms, and **only** these three: `fac:anchor` (sheet, cell, row,
column), `fac:headerRow`, `fac:extent`.

> **They are annotations ON a valid CSVW document, never a replacement for
> one.** A reader with a standard CSVW parser ignores the `fac:` keys and still
> gets a correct table description. That property is the entire reason for
> adopting a standard rather than inventing a schema, so it is **tested**
> (`csvwOnly()` in `schemas/tabular-csvw.ts`) rather than asserted.

Adding a fourth `fac:` term is the moment to stop and ask whether CSVW really
cannot express it. Usually it can.

## "As best as can" means three states, never two

The owner's phrase, and this repository's oldest rule wearing different
clothes. Every field is **determined**, or **explicitly undetermined with a
reason**. Nothing defaults.

| field | determined when | undetermined looks like |
|---|---|---|
| `datatype` | the column's values classify | `"any"` + `datatypeSource: "undetermined"` |
| `fac:extent` | rows AND columns are both known | both `null` + `source: "undetermined"` |
| `fac:anchor.sheet` | the format has sheets | `null` — a CSV has none, and that is DETERMINED |
| `fac:anchor.cell` | the format has A1 refs | `null` for a CSV |

Two of those nulls are worth separating carefully. **A CSV's `sheet: null` is a
determined answer** — a CSV genuinely has no sheet, and writing `"Sheet1"`
would invent one. An `undetermined` extent is the opposite: we looked and could
not tell. The schema enforces the difference; `source` is what tells them
apart, and a half-known extent is refused outright because it reads as a
measurement.

**Never guess a datatype to avoid an `undetermined`.** A column of `1, 2, 3,
N/A` is not an integer column. `any` with a recorded reason is a better answer
than `integer` with a silent coercion, because the second one is indis-
tinguishable from a correct reading.

## Generic workflow, format-specific tools

The *process* does not change between formats; *reading the bytes* does.

```
sniff → route → extract → annotate → validate
```

One workflow. One tool per format — `tabular-csv`, `tabular-xlsx` — each
declared in `tools/index.ts` and naming this skill in `satisfies`. A CSV has one
table and no cells outside it; a workbook has sheets, possibly several tables
per sheet, and a table that may start anywhere. That difference lives in the
tool, never in the workflow and never in the schema.

Routing a CSV is **not** a sniff: a CSV has no magic bytes, and bean `p67i`
established that it must not become an extension guess either. The content
question is the only one available — do the first rows split into the same
number of fields, more than one?

## A stub must be impossible to mistake for a result

No extractor ships today (the owner: *"no tooling needed, stub out, make QA to
catch absence"*). A tool that has not been built records `fac:stub` with the
tool's name, a reason, and a **date** — undated, a stub cannot be told from
abandoned work, which is the same argument `bean-blocking` makes for an expiry.

Three rules, each one paid for:

1. **A stub is never `met`.** It is `not-derivable`, naming the tool. A stub
   that reports success is worse than no tool at all.
2. **A half-stub is refused.** `fac:stub` alongside non-empty `columns` fails
   schema validation, because a thin-but-present extraction reads as a working
   one. This is the `6xaz` shape: sheet names right, headers empty, output
   looking like a workbook that simply had no headers.
3. **A stub expires.** When the real tool lands, `fac:stub` must go. `bun run
   check:tabular-stubs` fails CI when a record carries both a stub and real
   columns, and reports every outstanding stub on every run.

Rule 3 is the one that rots if nobody writes it down. This session fixed the
same defect four times — a restated list, a reason in a YAML comment, a
backlog keyed to the wrong thing, a third state with no expiry — and then
introduced a fifth: a probe that looked for `transcript.json` when the arm
writes `transcript/`, so the ratchet could never have fired. **A declared
exception must carry something a test can re-derive.**

## What this skill does not cover

- **The narrative** — what a dataset is *about*. That needs an author; bean
  `p67i` stopped there deliberately, and the headers being right there is
  exactly why assembling one from them would be fabrication.
- **Migrating `folio-tabular-records/v1`.** Bean `eief` carries it.
- **What a sheet IS in the document graph** — whether a sheet is a grouping
  node or a `table` block. That is `0lmb` territory and blocks `p67i`'s
  manifest.
