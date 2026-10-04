---
# folio-assistant-3p7c
title: 'MVP: bootstrap-provable layers — folio_init/instance-init against one layer alone, in an empty repo'
status: completed
type: epic
priority: high
tags:
    - mvp
created_at: 2026-10-04T09:56:42Z
updated_at: 2026-10-04T09:56:42Z
parent: folio-assistant-vuip
---

The MVP the owner ruled in `tndo` (2026-09-30), grouped so its progress can be read in one place.

> **MVP = `folio_init` creates a working folio against that layer ALONE, in an empty repository.**

Refined by the owner's 2026-10-01 ruling on `mer2`: for a layer with no adapter (`bootstrap`, `cat-harness`) the operation is an **instance-init**, not a folio — so "working" means the instance-init succeeds against that layer alone and the checkout can claim a bean, read the conventions and run the next step.

## How membership is recorded — a tag, not a reparenting

Members carry the tag **`mvp`** and keep their existing parents (`vke6`, `7x5n`, `iirv`, `zzmr`), so those trees are not rearranged to make this view. List them with `beans list --tag mvp`.

Created at the owner's request, 2026-10-04 (session https://claude.ai/code/session_01Ga3HjmX3ag9vTgZWDSmsFi), after a review found no bean or issue named "MVP" and the path's root blocker (`mer2`) unclaimed.

## The path, as measured 2026-10-04 on `origin/main` at f8e1006d1

| bean | role on the path | status then |
|---|---|---|
| `tndo` | the definition (ruled) | todo — done-when 2, 3 open |
| `mer2` | instance-init split, so the definition is expressible | claimed 2026-10-04 |
| `zmdo` | fork the two layers, prove empty-repo bootstrap — the falsifier | todo, blocked by `mer2` |
| `ybsz` | S6 standalone rehearsal | todo, blocked by `txue` |
| `txue` | S5 code out of cat-harness | todo |
| `vj2p` | stage 1d: cat-harness self-contained | todo, blocks `ho66` |
| `ho66` | stage 2: standalone rehearsal | in-progress (PR #1977, draft) |
| `pyds` | stage 0: preconditions | todo |
| `wggr` | invert the stub pattern | in-progress, no PR seen |
| `b5f0` | what instantiating a harness means | todo, idle since 09-20 |
| `izqr` | bootstrap on an empty repo | in-progress, no PR seen |
| `zlmp` | wrong-direction import edges at 0 | in-progress |

## Done when

- [x] `zmdo`'s four per-layer conditions hold for `cat-harness` and `folio-assistant-core` (the layers `zmdo` calls by their pre-rename names `agentic-harness` and `folio-assist-core`, beans `4wzf`, `yx9p`), each run in an empty repository.

## Summary of Changes — MVP met, 2026-10-04

The MVP the owner ruled in `tndo` holds for both layers, proven in real empty repositories: the zmdo proof runs on 2026-10-04: litlfred/cat-harness-test run 37206112987 (cat-harness alone) and litlfred/folio-test `zmdo-proof` run 37206115053 (folio-assistant-core alone, document folio), both green against folio-assistant@8ea9e47.

Closed: `tndo` (definition met), `zmdo` (falsifier passed). Still open from this epic's list, and why — none of them is the MVP itself:

| bean | why still open |
|---|---|
| `mer2` | `x3bd`'s bootstrap-only test does not run through instance-init yet |
| `ho66` | the layer's OWN suite standalone: 472 failing for cat-harness (10-03) |
| `txue`, `vj2p`, `ybsz`, `pyds`, `wggr`, `izqr`, `b5f0`, `zlmp` | separation stages toward SEEDING, not the MVP |

**Next phase: seeding** — `smbc` (owner authorises seeding `litlfred/cat-harness`), gated by `hcpz`'s `seed:ready`.
