---
# folio-assistant-a1ku
title: Generate a paper's leanblueprint layout (blueprint/src) from its manifest, and wire it into the folio blueprint.yml
status: in-progress
type: task
priority: normal
created_at: 2026-09-30T13:39:21Z
updated_at: 2026-09-30T14:03:45Z
parent: folio-assistant-zzmr
---

Owner 2026-09-30: after #1591, 'fix the platform (1), then the blueprint wiring (3)'. Parent work: yxob / 6dvy (#1492).

## Why
The folio blueprint.yml runs docgen-action with blueprint: true, which needs <paper>/lean/blueprint/src/ (web.tex, print.tex, content.tex, macros/, plastex.cfg). Nothing generates it: blueprint-export.ts writes content only, and the one blueprint/src in the tree (cat-harness/blueprint/src) is a hand-written QOU copy in the platform.

## Measured
- leanblueprint 0.0.20 + plasTeX 3.1 + plastexdepgraph 0.0.5 build a minimal blueprint with its dep graph; the earlier 'unhashable' crash is input-driven, not a version pin.
- plasTeX fails on a \uses naming an absent label (error) and on a self-\uses (RecursionError).
- build.ts's default preamble path cat-harness/latex/preamble.tex does not exist.

## Todo
- [x] blueprint-layout.ts: manifest + rendered chapters -> blueprint/src; theorem envs from the renderer's ENV_NAMES; paper macros; annotation macros no-op
- [x] exporter drops self-\uses
- [x] tests, calibrated
- [x] verified on a real paper with plasTeX (qou unital-groebner-bases, read-only)
- [x] template blueprint.yml runs it before docgen-action
- [x] build.ts default preamble path: now a clear exit-2 naming --preamble (the preamble was removed on purpose by 0uu2)
- [ ] finding: cat-harness/blueprint/src is QOU content in the platform — report, do not delete
