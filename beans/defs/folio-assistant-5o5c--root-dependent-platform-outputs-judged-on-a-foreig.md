---
# folio-assistant-5o5c
$schema: bean/1.0.0
title: Root-dependent platform outputs judged on a foreign content root (translation:obsolete, state:visualizer, processes:render)
status: todo
type: bug
priority: high
tags:
    - ci
    - gates
created_at: 2026-10-21T15:37:07Z
updated_at: 2026-10-21T15:37:07Z
---

Measured on litlfred/smart-immunizations#66 (run 39619275196, every layer at main, 2026-10-21). Three gates fail on a content root for platform artefacts that only the DECLARING checkout produces, so no data PR can make them pass everywhere — committing what smart-immunizations' root builds makes folio-assistant's own run stale, and the reverse.

Same family as cat-tools-x5e0 (a content index's gate judging state only the declaring checkout has).

## Cases
1. **`translation:obsolete:check`** — `cat-harness/translations/{ar,zh}/process/publication-workflow.po`, 19 stale of 207. The stale msgids are the per-page "✎ Edit docs/source/process-publication-workflow/…" links, which are built per root. Against cat-harness main's own `docs/process/publication-workflow.md` the same catalogues are 0 stale (checked 15:30Z).
2. **`state:visualizer:check`** — `docs/en/cat-harness/qa/smart-immunizations/index.html` stale, `code/smart-immunizations/index.html` missing, `code/index.html` stale. `cat-harness.json` declares these `because: "checkout"` (one page per instance in the checkout), yet cat-harness tracks them.
3. **`smart-base:processes:render:check`** (possibly separate): 6 SVGs stale on the runner but unchanged when re-rendered locally against bootstrap-tools main dc87778 (lane S). Either root-dependence or renderer install drift; decide which.

## Options
- A: a gate run on a foreign root skips (with reason) outputs declared `because: "checkout"` / root-built, judging them only on the declaring repo's own run.
- B: stop committing checkout-dependent pages; build them at publish (as cat-harness#363 did for library pages).
- C: make the outputs root-independent (edit links relative to the instance, not the root).

## Done when
smart-immunizations#66's head (all layers at main) shows none of cases 1–3 as NEW, and folio-assistant's own gates stay green.
