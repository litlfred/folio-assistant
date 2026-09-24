---
# folio-assistant-rdy0
title: Process pages list the docs sections that present them ('Presented on')
status: completed
type: feature
priority: low
created_at: 2026-09-24T17:22:05Z
updated_at: 2026-09-24T18:01:26Z
parent: folio-assistant-tr05
---

## Why
The reverse of B5-fix: a generated `/processes/<x>.html` page does not say which prose sections present that process. The index is the same one B5-fix builds (`WebPageNode.asset.source`), so this is navigation for free once it exists.

## Done when
`gen-processes-viz.ts` emits a "Presented on" line per process page, from the same index, with a test.
