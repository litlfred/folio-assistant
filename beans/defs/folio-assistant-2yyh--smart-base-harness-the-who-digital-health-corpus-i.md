---
# folio-assistant-2yyh
title: 'SMART-BASE HARNESS: the WHO digital-health corpus, its methodologies and its voices'
status: in-progress
type: feature
priority: high
created_at: 2026-09-22T08:35:00Z
updated_at: 2026-09-22T08:35:00Z
---

Issue #877 https://github.com/litlfred/folio-assistant/issues/877

The owner, 2026-09-22: *"WHO dgital health needs a once voice. also lots of process in DIIG for digital transformation. the DIIG is a basis for the digital trasnformation handbooks. ingest docs, make methodlolgies subgraphs for project management.digital trasnform processes"*, and on placement: *"same as other smart-* now in corpus... we are migrating. want KG assets here, can break apart later. OK to reference smart-* github sources (e.g markdown) per the smart-* harnessing insutrctiots. needs smart-base harness"*.

## What arrived

Eight WHO PDFs uploaded to `litlfred/qou` as https://github.com/litlfred/qou/commit/a3d2266a1b08018af5f8f88c222c1e7b45e6a36c — raw bytes in a mathematics repository, ingested by nothing. `uploads/` is not corpus: the corpus-grep checklist searches `library/` only, so a file left there makes a clean grep mean "nobody has done this" while the source sits right there.

## The chain, and why the order is forced

A `voices` rule carries `{ libraryId, sectionId, pages, quote }` and `check:voices` REFUSES a rule whose citation does not resolve. A methodology is adopted by rendering it faithfully from the source, never from recollection. So ingestion is not one task among four — it is the precondition for the other three.

`smart-base` is staged as a top-level instance, the path `who-iris`, `smart-trust` and `smart-immunizations` are already on. Parent `nsbb` rules that a per-IG harness should not exist and that the DAK/IG pipeline belongs in an IG base under a new `smart-base` harness; this is that harness, holding KG assets first, with the pipeline question left where it is.

## Done when
- [ ] `smart-base/` declared, with `library`, `methodology`, `voices` and `scenarios` graphs
- [ ] the seven WHO publications ingested, rung chosen mechanically, anything unprobeable reported `undetermined` rather than guessed
- [ ] DIIG adopted as a methodology subgraph per `methodology-adoption`, refusals stated
- [ ] the digital-transformation processes executable as BPMN
- [ ] one or more voice profiles, every rule citing an ingested section
- [ ] `qou/uploads/` cleared once the bytes have a home
