---
name: reference-dataset-ingestion
user_invocable: true
description: >
  Ingest a published REFERENCE dataset — a constants table such as CODATA,
  AME or PDG — into a library entry whose values are addressable in prose as
  {{ <instance>.library.<entry>.<slug> }}, with edition, source, sha256 and
  licence recorded. Use when a paper quotes a physical constant, when a value
  is hard-coded in a script or registry, or before adding a "vendored
  snapshot" of someone else's numbers.
allowed-tools: Bash Read
---

# Reference dataset ingestion

## What this is for

A paper that quotes the electron mass should quote **one** electron mass, taken
from **one** named edition of a named table, and a reader should be able to
check where it came from. A vendored Python module of hand-copied literals
fails all three: qou had three disagreeing `m_e` registries (qou bean `me3r`)
and 53 scripts with hidden CODATA literals (`46ke`), and its `inv_alpha`
placeholder carried the **CODATA 2018** value `137.035999084` while the paper
cites CODATA 2022 (`137.035999177`).

So a reference table is ingested once, as data, and every use points at it.

## The result

A library entry on the existing **tabular** rung:

| file | holds |
|---|---|
| `tabular.jsonld` | `folio-tabular-records/v1`: format, the source's sha256, edition, publisher, `primaryUrl`, **`obtainedFrom`** and `retrievedAt`, and the sheet's headers |
| `values.json` | one record per quantity: `{ quantity, value, uncertainty, unit, exact }` |
| `licence.json` | what is known about reuse, in `check-source-licence`'s shape |

A value is then written in any block, and resolves the same way for the PDF,
the blueprint and the site (bean `kott`):

```markdown
$m_e c^2 = {{ folio-assistant-sci.library.codata-2022.electron-mass-energy-equivalent-in-mev | precision: 11 }}$ MeV
```

A record resolves to its `value`; `….uncertainty` and `….unit` are addressable
explicitly.

## Run it — CODATA

```sh
bun run folio-assistant-sci/content/pipeline/codata-ingest.ts \
  --source <allascii.txt> --out <library>/codata-<year> --edition <year> \
  --obtained-from "<exactly where this copy came from>" [--retrieved-at YYYY-MM-DD]
```

`--check` writes nothing and fails when the entry no longer matches the source.

**Get the source from the publisher when you can**:
`https://physics.nist.gov/cuu/Constants/Table/allascii.txt`. When the publisher
is unreachable, a verbatim copy from a named, versioned distribution is
acceptable **if `--obtained-from` says so**. The CODATA 2022 entry here was
built from SciPy 1.17.1's `scipy/constants/_codata.py` (`txt2022`), because
`physics.nist.gov` is blocked by this environment's network policy; the entry
says exactly that. Never record the publisher as where you got it from when you
did not.

## The rules that make it trustworthy

- **Values stay exact.** NIST's grouping spaces are removed; the value is kept
  as a decimal STRING (`9.1093837139e-31`), never a float, so
  `| precision: N` rounds from every published digit.
- **`(exact)` is exact**, with `uncertainty: null` — not zero, which would be a
  claim of a measurement.
- **Slugs are mechanical**: NIST's quantity name, lower-cased, other characters
  → `-`. Each record keeps the exact `quantity` string, so the mapping is stored
  rather than re-derived, and a collision is refused.
- **One edition per entry** (`codata-2022`, `codata-2018`). Editions revise
  values; mixing them in one entry makes a diff between editions invisible.
- **Licence: record what you know.** `unknown` with the places searched is a
  finding; an absent record is a gap; a guessed `stated` is worse than both.

## Known limits

- Only NIST's fixed-width `allascii` format is parsed. AME and PDG tables need
  their own parsers; the entry shape and the address rule stay the same.
- The raw source text is identified by sha256, not committed: re-fetch it from
  `primaryUrl` (or the named distribution) to verify.
- The tabular rung still records no cells for other datasets; `values.json` is
  what makes a REFERENCE table addressable.

## See also

- `witnessed-values` (core) — the `{{ … }}` syntax, prefixes and filters.
- `document-intake` / the ingestion pipeline — the tabular rung this uses.
