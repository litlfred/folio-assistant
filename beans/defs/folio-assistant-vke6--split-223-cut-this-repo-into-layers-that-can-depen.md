---
# folio-assistant-vke6
title: 'SPLIT (#223): cut this repo into layers that can depend on each other'
status: in-progress
type: epic
priority: normal
created_at: 2026-09-19T11:43:44Z
updated_at: 2026-09-20T18:48:38Z
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
