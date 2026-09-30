---
# folio-assistant-uyp8
title: Ingest CODATA as a library dataset with provenance, and the skills/tools to ingest reference datasets
status: todo
type: task
created_at: 2026-09-30T10:26:31Z
updated_at: 2026-09-30T10:26:31Z
parent: folio-assistant-zzmr
---

Owner 2026-09-30: *"CODATA would need to be properly ingested as a dataset into library (bean up task to do, add skills tools) and variables be like {{ qou.library.codata-2022.mass-electron }} or so"*.

## Measured 2026-09-30
- qou's CODATA values live in a hand-vendored Python snapshot: `computations/codata_2022_source.py` (CODATA_EDITION_YEAR=2022, CODATA_SOURCE_URL, ALLASCII_URL, VENDORED_SNAPSHOT_DATE 2026-05-23; 'No CODATA .dat fetcher'). Values reach prose through witness files (`codata-masses.witness.json`), which record commitSha/scriptHash but NOT the dataset's own provenance. qou bean me3r records three disagreeing m_e registries (reconciled); 46ke records 53 scripts with hidden CODATA literals.
- The ingestion pipeline has a tabular rung (`tabular.jsonld`, `folio-tabular-csvw/v1`) that records headers and source sha256 but NO cell values; its CSVW extractors are STUBs. `large-datasets/schemas/source-descriptor.ts` already models identifiers, volatility and archivalImperative, and names CODATA. `schemas/formalization-types.ts:431` has an unused `CODATAConstants` type.

## Done when
- [ ] a skill for ingesting a REFERENCE dataset (constants tables: CODATA, AME, PDG): fetch or accept the official file, record edition, source URL, retrieval date, sha256, licence (licence.json), volatility
- [ ] a tool that parses NIST's CODATA ASCII table (allascii) into a library entry holding the values themselves — quantity, value, uncertainty, unit, exact flag — addressable as `<instance>.library.<entry>.<quantity-slug>` (bean kott's resolver)
- [ ] quantity slugs are stable and documented (e.g. `mass-electron` vs NIST's 'electron mass'), with the mapping stored, not re-derived
- [ ] qou: CODATA 2022 ingested, witnesses and prose repointed at the library entry — qou work, ask the author before any qou PR
