---
# folio-assistant-792y
title: 'CSVW KEYS DANGLE: the tabular `fac:` annotation keys cannot be bound in a CSVW context under any prefix — they need absolute IRIs'
status: in-progress
type: bug
priority: normal
created_at: 2026-09-23T07:30:19Z
updated_at: 2026-09-23T09:53:04Z
parent: folio-assistant-0lmb
---

Found by bean `zaqn` (prefix = stub).

## What is wrong

`schemas/tabular-csvw.ts` writes four annotation keys as `fac:anchor`, `fac:headerRow`, `fac:extent`, `fac:stub`. A CSVW metadata document may put ONLY `@language` and `@base` in its local `@context` (W3C CSVW Metadata §5.2), so no prefix of ours can be bound there — `fac` expands as a URI scheme, the same defect `zaqn` fixed in the content context.

Renaming to `folio-assistant-core:` would move the defect, not fix it.

## Why it was not caught

No CSVW metadata document is committed today, so `check:context-emission` has nothing to read. Once one is committed the gate will flag `fac` as spoken-and-unbound.

## Decision (owner, 2026-09-23): the record is JSON; the CSVW is derived

Three answers were weighed: (1) plain JSON + a derived real-CSVW export,
(2) real CSVW with ~12 flattened full-IRI annotation terms, (3) JSON-LD with
our own context. The owner chose (1). Why: nothing reads the annotations as
linked data (`tabular-nodes.ts` reads `anchor.sheet` from the JSON), the
"renderings only for a consumer" rule, and JSON-LD dropping the DETERMINED
`null` the three-state rule depends on. (3) is non-conforming CSVW anyway.

Measured on the way in: the record had NO `@context`, so the skill's claim
that "a standard CSVW parser … still gets a correct table description" was
false, and `csvwOnly()` also leaked `datatypeSource` on every column.

## Todo

- [x] record filename -> `tabular.csvw.json` via one constant, `TABULAR_CSVW_FILENAME` (readers: gen-library-jsonld rung table + reader, check-tabular-stubs)
- [x] `toCsvw()` / `csvwTable()` replace `csvwOnly()`: CSVW `@context`, CSVW keys only at every level; `CSVW_KEYS` exported for the test
- [x] tests: context present; no key of ours at ANY level (falsified by leaking `datatypeSource`); filename is not `.jsonld`
- [x] skill `tabular-metadata`: the false claim replaced, the decision table recorded; `kg-export` note; the gate's `csvw` forward reason
- [x] bun run gates green (133/133); issue #1047; PR opened

## Found, not fixed here

`tabular.jsonld` (`folio-tabular-records/v1`, written by `tabular-records.py`)
is the same shape — `.jsonld`, an `@id`, no `@context`. Its keys are plain
names, so JSON-LD DROPS them rather than minting bad IRIs: lossy, not
dangling. None is committed. Worth the same decision when that format is
next touched or retired.

## Done when

No tabular record claims to be JSON-LD while carrying keys a processor would read as unbound compact IRIs, and a standard CSVW reader is handed a document that carries the CSVW `@context` and only CSVW keys.
