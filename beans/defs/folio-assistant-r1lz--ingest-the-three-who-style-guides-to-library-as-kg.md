---
# folio-assistant-r1lz
title: Ingest the three WHO style guides to library/ as KG, then derive the three WHO voices
status: todo
type: task
created_at: 2026-09-18T23:46:13Z
updated_at: 2026-09-19T00:52:55Z
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

_2026-09-19T00:13:21Z_ — ## Progress — ingestion half done, voice derivation still open

All three documents identified and ingested to `library/`. The third was only identifiable AFTER OCR: its filename is `WHO_PUB_TPS_93.1` and it is 121 scanned pages with zero text layer.

| upload | document | pages | TOC source | result |
|---|---|---|---|---|
| `9789241548960_eng.pdf` | **WHO handbook for guideline development**, 2nd ed (2014) | 179 | embedded outline (258 entries) | 250 sections, sound |
| `WHO_PUB_TPS_93.1.pdf` | **WHO Editorial Style Manual** (1993) | 121, scanned | inferred from its own contents page | 121 OCR pages + 42 sections, good |
| `WPR-RDO-2020-003-eng.pdf` | **Publication and Information Products Style Guide**, WHO WPRO (2020) | 33 | inferred — **WRONG** | `structure.json` only, no sections |

Capabilities had to be installed: `pymupdf`/`pdfplumber` via pip, `tesseract-ocr` and `poppler-utils` via apt. All four probed MISSING at the start of the session (`bun run src/index.ts --check-deps`).

**The OCR'd manual is the primary source for `who-editorial`,** and it already contradicts an assumption: PR #210 asserts 'British spelling as the baseline'. The manual's actual text (p9) recommends Butterworths for British and Dorland's for American spelling 'respectively' as general references, and gives its real rules as worked pairs — 'Crohn disease, not Crohn's disease', 'Down syndrome, not Down's syndrome'. The rules need reading, not assuming, which is the whole reason for ingest-first.

Two pipeline defects found and beaned: `6xaz` (pdf-structure read a sample table on p22 of the WPRO guide as that document's own structure, emitting 11 sections named after another publication) and `rlp5` (`pdf-ocr.py -o` and `pdf-structure.py -o` disagree about whether the path includes `<doc-id>/`, so the two steps of one pipeline do not compose and a second scanned document would silently overwrite the first's cache).

## Still to do
- Derive the three voice profiles FROM the ingested sections, each rule citing the section node it came from, so `source` is never null.
- Reconcile with PR #210 (merge, not rebase — its base `b6fab8ce4` is far behind).
- Keep folio-assistant's own docs on NO voice, per #208.
- The L1 completeness gate has not been run over these three.

_2026-09-19T00:52:55Z_ — ## Voices landed, with a third scoping axis

All four voices derived and cited; `voice-review.bpmn` called from `review-narrative.bpmn`; two skills bound to roles; one QA criterion per voice.

**`voices` is a third criterion-scoping axis, and it defaults the OPPOSITE way from `profiles`.** `profiles` absent means every profile, because narrowing silently stops a check and a wrong pass is believed where a wrong fail is argued with. `voices` present means opt-in only, because applying an unasked-for register produces confident findings against prose written to a different standard — a wrong FAIL at scale. Added to `def_hash` so re-scoping invalidates cached verdicts (bean `cv10` in a new axis).

**The gate is applied ONCE at criterion selection, not per block.** A voice is a property of the folio, so asking 122 times gives 122 identical answers — and for the `automated: false` voice criteria it would have put 4 x 122 phantom rows in the agent queue. Verified both ways: no voice active -> 4 skipped; `who-editorial` active -> 3 skipped and the fourth correctly enters the queue.

**One criterion per VOICE, not per rule.** 34 rules would put 30 permanently `needs-agent` rows on every sidecar — a queue nobody drains. The unit an agent adjudicates is a block against a voice.

Found a third instance of the 'recorded but not in force' family while verifying: `insertAdjudication` appended a RE-adjudication behind the reviewer's own earlier entry, so `list[0]` served reasoning its author had withdrawn. Surfaced because I edited the diagram-count line and my own 2026-09-18 ruling quoted a sentence that no longer existed. A reviewer now supersedes themselves; a different reviewer is still history.
