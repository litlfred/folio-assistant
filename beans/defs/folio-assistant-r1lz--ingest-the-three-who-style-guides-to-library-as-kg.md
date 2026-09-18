---
# folio-assistant-r1lz
title: Ingest the three WHO style guides to library/ as KG, then derive the three WHO voices
status: todo
type: task
created_at: 2026-09-18T23:46:13Z
updated_at: 2026-09-18T23:46:13Z
---

Issue #208. **The documents are now in the repo** — owner uploaded them in `eec93ecc8` (on `main`), at the repo root: `9789241548960_eng.pdf` (2.1 MB), `WHO_PUB_TPS_93.1.pdf` (3.3 MB), `WPR-RDO-2020-003-eng.pdf` (2.8 MB). This removes the blocker recorded earlier this session: `iris.who.int` is denied by this environment's network egress policy (`curl` -> `CONNECT tunnel failed, response 403`; `WebFetch` -> `EGRESS_BLOCKED`), so they could not be fetched.

Owner ordering, verbatim: **'do document ingest -> KG first.'** The ingestion comes before any voice profile is written, and the reason is visible in PR #210: its `voices/who-editorial.json` carries 10 plausible rules (British `-ise`, no period after `Dr`, people-first language, NLM/Vancouver) and `source: null` — asserted from an agent's general knowledge, citing nothing. A voice with no provenance is the same class of defect as a measurement with no date.

## Depends on
The `uploads/` + `library/` declaration bean — there is nowhere to ingest TO until `library/` exists. The three PDFs are currently at the repo root, which is neither stage of the pipeline.

## Done when
- The three PDFs are in `uploads/`, ingested through the documented single entry point into `library/` as L1 KG, and the `ingest-l1-completeness-gate` passes on them.
- Each of the three voice profiles cites the ingested node it derives from — every rule traceable to a passage, so `source` is never null again.
- The folio-assistant's OWN documentation applies none of them: issue #208 says 'the folio-asst's own documentation content doesnt have any voice'.
- Voices are opt-in, never automatic ('we shouldnt autmoatically apply voices... but for now we will turn all three on').
- Reconciled with PR #210 rather than rewritten — it already has `schemas/voices.ts`, a `voice-review.bpmn` and two skills. Its base is `b6fab8ce4` against a `main` that has moved a long way, so it needs a MERGE, not a rebase.
