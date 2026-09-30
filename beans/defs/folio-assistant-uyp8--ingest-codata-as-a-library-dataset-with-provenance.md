---
# folio-assistant-uyp8
title: Ingest CODATA as a library dataset with provenance, and the skills/tools to ingest reference datasets
status: completed
type: task
priority: normal
created_at: 2026-09-30T10:26:31Z
updated_at: 2026-09-30T15:42:28Z
parent: folio-assistant-zzmr
---

Owner 2026-09-30: *"CODATA would need to be properly ingested as a dataset into library (bean up task to do, add skills tools) and variables be like {{ qou.library.codata-2022.mass-electron }} or so"*.

## Measured 2026-09-30
- qou's CODATA values live in a hand-vendored Python snapshot: `computations/codata_2022_source.py` (CODATA_EDITION_YEAR=2022, CODATA_SOURCE_URL, ALLASCII_URL, VENDORED_SNAPSHOT_DATE 2026-05-23; 'No CODATA .dat fetcher'). Values reach prose through witness files (`codata-masses.witness.json`), which record commitSha/scriptHash but NOT the dataset's own provenance. qou bean me3r records three disagreeing m_e registries (reconciled); 46ke records 53 scripts with hidden CODATA literals.
- The ingestion pipeline has a tabular rung (`tabular.jsonld`, `folio-tabular-csvw/v1`) that records headers and source sha256 but NO cell values; its CSVW extractors are STUBs. `large-datasets/schemas/source-descriptor.ts` already models identifiers, volatility and archivalImperative, and names CODATA. `schemas/formalization-types.ts:431` has an unused `CODATAConstants` type.

## Done when
- [x] a skill for ingesting a REFERENCE dataset (constants tables: CODATA, AME, PDG): fetch or accept the official file, record edition, source URL, retrieval date, sha256, licence (licence.json), volatility
- [x] a tool that parses NIST's CODATA ASCII table (allascii) into a library entry holding the values themselves — quantity, value, uncertainty, unit, exact flag — addressable as `<instance>.library.<entry>.<quantity-slug>` (bean kott's resolver)
- [x] quantity slugs are stable and documented (e.g. `mass-electron` vs NIST's 'electron mass'), with the mapping stored, not re-derived
- [x] qou: CODATA 2022 ingested, witnesses and prose repointed at the library entry — qou work, ask the author before any qou PR — done in litlfred/qou#7492 (library/codata-2022, 58 refs migrated, alpha re-run) and #7493 (m_n kept AME-derived by owner decision)

## Round 1, 2026-09-30
- Tool `folio-assistant-sci/content/pipeline/codata-ingest.ts`; skill `folio-assistant-sci/skills/data/reference-dataset-ingestion.md` (new declared dir `folio-assistant-sci-data-skills`).
- **CODATA 2022 ingested** into `folio-assistant-sci/library/codata-2022/`: 355 quantities, tabular rung + `values.json` + `licence.json` (unknown, searched). Addressable as `{{ folio-assistant-sci.library.codata-2022.<slug> }}` — ONE copy for every folio, rather than one per folio. Slugs are NIST's names, mechanical (`electron-mass-energy-equivalent-in-mev`); the owner's `mass-electron` was an example ("or so"), and a hand alias would be a second vocabulary.
- **Source honesty:** physics.nist.gov is blocked by this session's network policy, so the copy is SciPy 1.17.1's verbatim embed (`scipy/constants/_codata.py`, `txt2022`); `obtainedFrom` says so, `primaryUrl` names NIST, sha256 recorded.
- **Finding (qou):** `inv_alpha`'s placeholder witness holds `137.035999084` — the CODATA **2018** value; CODATA 2022 is `137.035999177`. Not changed here — qou work, ask the author.
- Tests 7, pinned to published CODATA 2022 values and to the committed entry; calibrated (keeping grouping spaces fails 4).


## Summary of Changes
- #1591: codata-ingest.ts, library/codata-2022 (355 quantities, exact decimal strings, provenance and licence), and the reference-dataset-ingestion skill.
- qou: its own library/codata-2022 (byte-identical values); alpha_em_shift_chain reads 1/α from it (was the CODATA-2018 value labelled 2022); the codata-masses witness regenerated; m_n kept AME-derived by owner decision (qou#7492, #7493).
