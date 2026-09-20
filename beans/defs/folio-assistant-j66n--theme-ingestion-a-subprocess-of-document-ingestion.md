---
# folio-assistant-j66n
title: 'THEME INGESTION: a subprocess of document ingestion, and one Theme node with kind sticky|webpage|publication'
status: in-progress
type: task
priority: high
created_at: 2026-09-20T08:02:10Z
updated_at: 2026-09-20T08:02:10Z
parent: folio-assistant-kupb
---

Owner: extract 'smiilar stylngs for a webpage theme and also for publiccation themes', and (this session) ONE node with a kind discriminator rather than three node kinds.

TWO SOURCES, ONE ARTEFACT:
- WEBPAGE theme from the IRIS item page's own assets (`client-theme.css`, `styles.e55b0c9926626404.css`, three SVG logos), which is what a DSpace deployment's theme IS.
- PUBLICATION theme from the style guide's own rules — the document that TELLS you the palette, typography and pagination.

WHY THE DISCRIMINATOR AND NOT THREE KINDS. `schemas/theme.ts` already exists and already carries the argument: 106 hardcoded hex colours against 22 custom properties is what named roles fix. Three spellings of 'accent colour' reintroduces exactly that, one level up.

CONSTRAINT THE EXISTING NODE ALREADY STATES AND A NEW KIND MUST NOT BREAK: 'a theme sets the stripe's hue; it never sets its width to zero' — colour alone carrying a whole signal fails SC 1.4.1. A publication theme inherits that rule, and the style guide's own measured rule agrees with it ('Never red with green, never blue with yellow', `who-des-figure-colour-accessibility`).

LIVE COLLISION: PR #465 touches `schemas/theme.ts` and `themes.ts`. Merge, do not rebase.

## Done when
- `ingest-theme.bpmn`, called from `document-ingestion.bpmn`.
- `kind` on `ThemeSchema`, existing sticky themes unchanged and still valid.
- Two worked themes: `iris-web` and `who-wpro-publication`, each citing where every value came from.
- Every layout still required; a missing layout stays INVALID, never degraded.
