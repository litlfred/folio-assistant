---
# folio-assistant-g6yr
title: 'Per-block QA icons: rework translation-qa-sweep to per-node granularity'
status: todo
type: task
priority: normal
created_at: 2026-09-18T15:07:07Z
updated_at: 2026-09-18T15:07:53Z
---

Asked for directly on #203: "where are the QA icons next to each content block
for the sidecar QA".

**They do not exist — not hidden, never built.** Measured 2026-09-18 on `main`:

- `find content/docs -name "*.qa.json"` → **0 sidecars**
- the generated page carries **no per-block QA markup at all**;
  `mountTranslationBadges` renders one language badge and one QA badge under
  the `h1`, from Jekyll front matter.

**The blocker is upstream of the UI.** `content/pipeline/translation-qa-sweep.ts`
works at PAGE granularity (`PageTranslationStatus`), so there is no per-block
result for an icon to render.

Chain, in order:
1. rework the sweep to per-node granularity
2. `gen-docs-pages.ts` emits per-node anchors + data
3. `docs-ui.js` renders the icon beside each block
