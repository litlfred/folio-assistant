---
# folio-assistant-dv8v
title: 'B6b-1 (#1168): the 8 generated writtenBy families get Zod schemas'
status: in-progress
type: task
priority: normal
created_at: 2026-09-24T18:07:58Z
updated_at: 2026-09-24T18:42:45Z
parent: folio-assistant-tr05
---

## Owner decision 2026-09-24
"B: type all 9 now". The graph-kind registry (@general) named the script writing each untyped family. Typing them removes the backwards pointer and the finding it recorded.

## Families
folio-bean-index/v1, folio-translation-status/v1, folio-schema-graph/v1, folio-library-index/v1, folio-library-entry/v1, folio-voices-index/v1, folio-graph-projection/v1, folio-qa-index/v1, folio-intake/v1.

## Done when
Each is a `validator` entry; `check:kind-validators` parses every node of each; the `writtenBy` form is gone from NodeSchemaRef and its readers (gen-uml-overview, kg-validate).
