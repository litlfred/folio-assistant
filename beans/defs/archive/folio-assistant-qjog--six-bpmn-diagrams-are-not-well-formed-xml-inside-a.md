---
# folio-assistant-qjog
title: Six BPMN diagrams are not well-formed XML (-- inside a comment)
status: completed
type: task
priority: normal
created_at: 2026-09-18T22:25:44Z
updated_at: 2026-09-18T23:11:23Z
---


**Measured 2026-09-18**, on `main` (verified by stashing, so it is not this
branch's doing).

`document-ingestion.bpmn`, `evidence-retrieval.bpmn`,
`ingest-build-l1-kg.bpmn`, `ingest-derive-content.bpmn`,
`ingest-extract-structure.bpmn` and `ingest-l1-completeness-gate.bpmn` all
carry a `--` inside an XML comment, in the header line:

> by `bun run render:bpmn` -- never hand-edit the SVG.

XML 1.0 §2.5 forbids `--` within a comment. Python's expat rejects all six with
`not well-formed (invalid token)`.

**Why nothing has caught it.** `bpmn-moddle` is lenient and parses them, so
`kg:audit` reports `unknown 0` and every gate in the repo is green over them.
The audit is therefore telling the truth about what *this instance* can load,
and is silent about what anyone else can.

**Why it matters anyway.** Each of those six files' own header says: *"Open it
in bpmn.io, Camunda Modeler, or any other BPMN 2.0 tool."* A tool with a
conformant parser cannot open them. The file that is declared the source of
truth is unreadable by the tools it names.

## Done when

An em dash, a colon, or a single hyphen replaces the `--` in all six headers,
and a check refuses a `.bpmn` that a conformant parser rejects — so the next one
is caught rather than measured a year later. Cheapest form of the check is a
strict parse in `scripts/render-bpmn.ts --check`, which already reads every
diagram.

## Summary of Changes

**Seven artefacts, not six.** Widening the scan from `.bpmn` to `.dmn` found
`processes/decisions/pages-live-gate.dmn` carrying `--` too — in
`` `bun run scripts/pages-bootstrap.ts --json` ``, a real CLI flag, so it
needed rewording rather than a character swap. The bean's count was of the
file type it happened to look at.

Fixed: 11 occurrences of ``render:bpmn` --`` → em dash across 6 diagrams (6 in
comments and illegal, 5 in `<bpmn:documentation>` and legal — changed anyway,
since a documentation line migrating into a comment is the same bug again),
plus the DMN reword. All 27 diagrams now parse under expat.

`scripts/xml-comment-check.ts` implements the XML 1.0 §2.5 comment production
directly, and the reason it is hand-written is measured: **both XML parsers
already in this repo's dependencies accept the invalid comment.**
`fast-xml-parser`'s `XMLValidator.validate()` returns `true` for
`<root><!-- a -- b --></root>`, and the moddles are what shipped the bug.
Delegating would have produced a check that passes over the corpus that
motivated it.

Scope is stated in the module rather than implied: it checks the comment
production and nothing else, so it is **not** a well-formedness check. Gated by
`scripts/tests/xml-comment-check.test.ts` (runs everywhere) rather than only by
`render:bpmn`, which needs Chromium — a machine without a browser build would
otherwise skip the check, which is the shape of the failure one level up.
Also called from `render-bpmn.ts` before the browser launches, and available as
`bun run check:xml-comments`.

Verified by reintroducing the bug: the check names
`document-ingestion.bpmn:7` — the same file and line expat reports.
