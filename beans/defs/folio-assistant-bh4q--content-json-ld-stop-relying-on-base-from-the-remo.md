---
# folio-assistant-bh4q
title: 'Content JSON-LD: stop relying on @base from the remote context (JSON-LD 1.1 §4.1.3)'
status: todo
type: task
priority: normal
created_at: 2026-10-01T18:30:16Z
updated_at: 2026-10-01T18:33:37Z
---

## Why
Measured 2026-10-01 (bean jcet, item 2): emitted content .jsonld reference `https://litlfred.github.io/folio-assistant/ns/content/v1.jsonld` by URL, and relative @ids resolve to `https://litlfred.github.io/folio/…` only because jsonld.js 8.3.3 applies `@base` from a remote context. JSON-LD 1.1 §4.1.3 (held: w3c-2020-json-ld-1-1 sec-033-413-base-iri) says `@base` in a remote context is ignored, so a conforming processor resolves those @ids against each document's own URL. This is a portability defect for any consumer, not a live defect in this pipeline.

Voice rule `ld-no-base-in-a-remote-context` (folio-assistant-core/skills/voices/linked-data) states the rule. PROV reports already comply (schemas/prov-jsonld.ts puts @base in the document's own context).

## Options (owner to pick)
1. Emit absolute @ids in content documents.
2. Put `@base` in each document's own (embedded) context, beside the remote URL.

## Done when
- [x] owner picks 1 or 2 (option 2, 2026-10-01)
- [ ] emitter changed; a strict-1.1 expansion test (document loaded from a foreign URL) gives the same IRIs
- [ ] regen fixed point; CI green


## 2026-10-01 — owner ruled: option 2
Put `@base` in each document's own (embedded) context beside the remote URL — the same shape schemas/prov-jsonld.ts already emits.
