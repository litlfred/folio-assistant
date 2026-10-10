---
$schema: folio-fsh-guts/v1
title: "Duplicates of folio-assistant-core's adjudication and materialization, left below it"
kind: duplicate-copies
movedOn: 2026-10-10
movedFrom: "cat-harness/schemas/{adjudication.ts,adjudication.test.ts,materialization.ts}; cat-harness-tools/scripts/{cache-index.ts,tests/materialization-last-read.test.ts}"
bean: folio-assistant-ujiv
summary: >-
  When folio-assistant-core was seeded (2026-10-08) these modules were copied
  into it but not removed from the layers below, and later edits landed
  unevenly. The KG export then gave both copies one IRI and gen-slice-sqlite
  stopped on a UNIQUE constraint. Core owns content vocabulary, so core's
  copies are kept; bean o57z's debate record, which had landed only on the
  harness copy, was moved into core first (folio-assistant-core#37). The
  tools cache-index was never registered as a script; core's cache:index is.
  Owner, 2026-10-10: "go". Packed from cat-harness 5fa5d86 and
  cat-harness-tools 4fd818e with git archive.
---

# Core-schema duplicates

`core-schema-duplicates.tar.gz` beside this file holds the five files as they
stood on each repository's main (cat-harness `5fa5d86`, cat-harness-tools
`4fd818e`). The live versions are folio-assistant-core's
`schemas/adjudication.ts`, `schemas/materialization.ts` and
`scripts/cache-index.ts`.
