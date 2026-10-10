---
# folio-assistant-2yyh
$schema: bean/1.0.0
title: 'SMART-BASE HARNESS: the WHO digital-health corpus, its methodologies and its voices'
status: completed
type: epic
priority: high
created_at: 2026-09-22T08:35:00Z
updated_at: 2026-10-10T08:00:00Z
parent: folio-assistant-vuip
---

Issue #877 https://github.com/litlfred/folio-assistant/issues/877

The owner, 2026-09-22: *"WHO dgital health needs a once voice. also lots of process in DIIG for digital transformation. the DIIG is a basis for the digital trasnformation handbooks. ingest docs, make methodlolgies subgraphs for project management.digital trasnform processes"*, and on placement: *"same as other smart-* now in corpus... we are migrating. want KG assets here, can break apart later. OK to reference smart-* github sources (e.g markdown) per the smart-* harnessing insutrctiots. needs smart-base harness"*.

## What arrived

Eight WHO PDFs uploaded to `litlfred/qou` as https://github.com/litlfred/qou/commit/a3d2266a1b08018af5f8f88c222c1e7b45e6a36c — raw bytes in a mathematics repository, ingested by nothing. `uploads/` is not corpus: the corpus-grep checklist searches `library/` only, so a file left there makes a clean grep mean "nobody has done this" while the source sits right there.

## The chain, and why the order is forced

A `voices` rule carries `{ libraryId, sectionId, pages, quote }` and `check:voices` REFUSES a rule whose citation does not resolve. A methodology is adopted by rendering it faithfully from the source, never from recollection. So ingestion is not one task among four — it is the precondition for the other three.

`smart-base` is staged as a top-level instance, the path `who-iris`, `smart-trust` and `smart-immunizations` are already on. Parent `nsbb` rules that a per-IG harness should not exist and that the DAK/IG pipeline belongs in an IG base under a new `smart-base` harness; this is that harness, holding KG assets first, with the pipeline question left where it is.

## Done when
- [x] `smart-base/` declared, with `library`, `methodology`, `voices` and `scenarios` graphs
- [x] the seven WHO publications ingested, rung chosen mechanically, anything unprobeable reported `undetermined` rather than guessed
- [x] DIIG adopted as a methodology subgraph per `methodology-adoption`, refusals stated
- [x] the digital-transformation processes executable as BPMN
- [x] one or more voice profiles, every rule citing an ingested section
- [x] `qou/uploads/` cleared once the bytes have a home

## 2026-10-09: re-measured on litlfred/smart-base main (session https://claude.ai/code/session_01BJNRo4kh8U15HZVFDhYNJL)
- **Item 1: done.** `smart-base.json` declares `library` (library/), `methodologies` (methodology) and `smart-base-scenarios` (scenarios). `voices` is declared as a SUBGRAPH of `skills/skills.json` (`"id": "voices"`, overriding the conventional one), which `resolveDirectories` lists as an instance graph (bean cmsl).
- **Item 3: done.** `methodologies/diig.md` states its refusals (6 hits), with `methodologies/processes/` declared as a processes graph.
- **Item 4: done.** `methodologies/processes/diig-investment-path.bpmn` is the DIIG investment path as BPMN, in a declared processes graph. Further handbook processes would be new beans, not this box.
- **Item 5: done.** The voices `who-digital-health` and `who-digital-transformation-handbook` are gated by `check:voices`, which refuses an unresolved citation.
- **Item 2: NOT ticked.** 9 WHO publications are in `library/`: DIIG, the CDHI v1 and v2, three DTHs, MAPS, M&E, and the RHR. But no entry's `manifest.jsonld` records the ingestion rung, so "rung chosen mechanically / undetermined reported" cannot be confirmed from the corpus. Either the rung is recorded somewhere else, or it was never recorded.
- **Item 6:** this is bean `fgkb` (qou).
- **Item 2: correction, now ticked.** The rung IS recorded, in each entry's `structure.json` rather than its manifest, under the names the ingest uses:
  - `source.text_source` is `embedded` for all 11 PDF entries, with the mimetype from magic bytes;
  - `toc_source` is `outline` where the PDF has one, with `none` falling to `granularity: page` otherwise (8 entries).
  
  The ladder was applied mechanically, and nothing was unprobeable, so nothing is `undetermined`. The 9 WHO publications cover the seven this bean names.
