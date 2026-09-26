---
# folio-assistant-1h6u
title: 'main red after 2c295f8 + translation batches #1404/#1409: 6 dangling skill links, 9 stale derived sets'
status: completed
type: bug
priority: high
created_at: 2026-09-26T14:30:05Z
updated_at: 2026-09-26T14:30:05Z
parent: folio-assistant-1xhc
---

Measured on pristine main f850f721a06, 2026-09-26. The failing checks were glossary-page, gen-skill-docs, gen-docs-pages, docs:auto, translation:index, check:ci-invocations (which re-runs the two generators), check:subgraphs, state:visualizer and docs:harness. Every open PR inherited them through its merge ref.

Causes:
- **2c295f8**, committed straight to main, rewrote skill script paths as `../../cat-harness/scripts/…`. From `cat-harness/skills/<pkg>/` that resolves to `cat-harness/cat-harness/scripts/…`. Six links were affected, in document-intake.md and latex-build-cache.md. It also regenerated no derived file.
- **#1404 and #1409**, the translation batches, landed without the translation index or docs pages regenerated.

## Summary of Changes

- Repointed the six links to `../../scripts/…`. Each target was checked to exist first.
- Regenerated, with the repo's generators only: gen-skill-docs, gen-docs-pages, docs:auto, translation index, glossary export and page, kg:audit, kg:detangle (no change), audit:coverage, state:visualizer, docs:harness, and uml:overview last.
- bun run gates: the only remaining failures are the deliberate drift pair (the `no NEW drift` test and translation:drift:check).
