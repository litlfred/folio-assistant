---
# folio-assistant-gk55
title: Re-site the `folio` graph kind out of agent-harness into folio-assist-core
status: completed
type: task
priority: normal
created_at: 2026-09-18T17:23:49Z
updated_at: 2026-09-18T17:27:37Z
---

Issue #223 comment 16:28 and the author's confirmation: 'folio content type should be in folio-asst-core'.

schemas/agent-harness.ts currently lists `folio` among GRAPH_KINDS, with
renderable: true. That contradicts 'agent-harness is not self documenting' —
the harness cannot render, so the renderable kind is not its to declare.

Shape: make graph kinds REGISTRABLE rather than a closed union. The harness
declares the base three (tools, kg, schemas); folio-assist-core registers
`folio`. Reuses the Phase 0.1 load-time registration rather than inventing a
second mechanism, and keeps core -> harness as the legal direction.

Falsifier: if the harness still has to know the string 'folio' anywhere for the
declaration to validate, the re-siting is cosmetic.
