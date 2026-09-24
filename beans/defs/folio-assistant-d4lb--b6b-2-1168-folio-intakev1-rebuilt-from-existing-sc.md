---
# folio-assistant-d4lb
title: 'B6b-2 (#1168): folio-intake/v1 rebuilt from existing schemas; adapter writes it; strict MaterializationSchema'
status: in-progress
type: task
priority: normal
created_at: 2026-09-24T18:42:45Z
updated_at: 2026-09-24T18:51:25Z
parent: folio-assistant-tr05
---

## Owner decisions 2026-09-24
- "B C, look to existing standards to restructure schema" → then "reduce reuse recycle" → then "Yes, red until you fill gates".

## Facts (measured)
- No code writes `folio-intake/v1`: the 4 files under who-iris/uploads/*/intake.json are hand-authored. The registry's `writtenBy: scripts/library-graph.ts` is wrong — it only reads them.
- `adapters/document/index.ts` writes a DIFFERENT intake.json (no $schema; id, source{type,url,fetchedAt}, format, pipeline{stage,*At}, classification, chapters, blockCount, targetPaper).
- wpr-rdo-2020-003-eng carries a `materialization` block with no `gates`, which MaterializationSchema requires for `materialized`.

## Plan (reuse, no new standard; DCAT stays held per 4sim)
| part | reuse |
|---|---|
| title / identifiers / type / subject | the Dublin Core record (folio-dublin-core/v1); intake keeps doc_id and points at it |
| source | ProvenanceSchema (upstream / local) from materialization.ts |
| capturedAt | same meaning as folio-extraction/v1's capturedAt; one ISO format |
| files[] | ArchiveEntrySchema's path/bytes/sha256/mimetype_sniffed |
| adapter pipeline state | moves to the extraction record |
| materialization | MaterializationSchema, strict |

## Done when
Both writers produce folio-intake/v1; the 4 files migrated; the wpr file validates once the owner supplies its five gate values (CI red until then, by the owner's choice); the writtenBy form removed from NodeSchemaRef.
