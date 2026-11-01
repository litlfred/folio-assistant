---
# folio-assistant-vke6
$schema: bean/1.0.0
title: 'SPLIT (#223): cut this repo into layers that can depend on each other'
status: completed
type: epic
priority: normal
created_at: 2026-09-19T11:43:44Z
updated_at: 2026-11-01T09:55:00Z
parent: folio-assistant-vuip
---

Issue #223 — cut this repo into layers that can depend on each other without
cycles.

`zlmp` is the gate: a lower layer importing from a higher one becomes a circular
dependency BETWEEN REPOSITORIES the moment the cut happens, so that count has to
reach zero before anything else here is safe. `x4a6` is a worked example of what
blocks until it does — `docs/` cannot be declared because `folio` is contributed
by core and the harness-layer readers throw on it.

The rest are the moves themselves (`rnfl`, `x3bd`, `4wzf`), what each layer is
allowed to contain (`79t3`), how skills reach a downstream instance (`x4mt`),
and the proof that an empty instance actually works (`zmdo`). `4dbr` keeps the
cut from assuming GitHub.

_2026-11-01T09:55:00Z_ — Closed. The cut this epic asked for has happened: cat-harness and cat-harness-tools left main on 2026-10-08 as their own repositories (`iai8`, PR #2517), and `check:import-direction` and `check:reference-direction` both report 0 wrong-direction edges across all 12 instances (recorded on `iirv`, 2026-10-30). The gate `zlmp` and every other child are `completed` or `scrapped`. The one open child, `r29x` (paused by the owner on 2026-10-24), is about todo and sticky references, not the split, so it now hangs from `yj32` (the board and todos epic). Issue #223 stays open for its wider architecture notes. Closed by the epic tidy-up thread, https://claude.ai/code/session_01Qmmkt6XTBi8PdXZBc7NTER.
