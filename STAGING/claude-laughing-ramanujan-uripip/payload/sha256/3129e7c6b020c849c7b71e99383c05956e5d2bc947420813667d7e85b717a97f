---
# folio-assistant-k9mv
title: SEED:READY upward paths — count declared paths that resolve only above the layer, not dependents discovery cannot see
status: completed
type: task
created_at: 2026-10-04T14:14:25Z
updated_at: 2026-10-06T19:30:00Z
parent: folio-assistant-vke6
---

`seed:ready`'s `sibling-discovery` criterion is re-aimed at what it said it protects against: **paths declared in a layer that resolve only in an instance above it**.

Owner's choice, 2026-10-04, from three options (re-aim / make discovery see sibling clones / record only), after this measurement:

- `seed:ready` failed `cat-harness` and `folio-assistant-core` on "discovery misses 3 dependents in a sibling layout". `hcpz` noted *"separate work needs to make discovery work without the aggregate root"*; no bean tracked it.
- But discovery is checkout-local **by ruling** (`cmsl`, in `harness-config.ts`: *"the tool sees what the checkout contains, not what the platform remembers having been next to"*). A seeded layer can never discover its dependents, so the count could never pass.
- And the probe's own docblock named the real risk as PATHS: *"each one it cannot find … is a path resolved through it that fails the day the layer is seeded."* Measured: 25 of 25 in-process Tool modules and all 8 distinct QA criterion source files declared by cat-harness resolve INSIDE cat-harness — `resolveImplementingPath` `via: own`.

## Done when

- [x] `probeUpwardPaths` counts paths declared in L (Tool modules per `toolsOf`, QA criterion sources, render targets) resolving `via: needs` or `ambiguous`; `missing` is left to `check:tools`.
- [x] Fact `siblingDiscoveryMisses` → `upwardPaths`, criterion `sibling-discovery` → `upward-paths`, `Rule_Discovery` → `Rule_UpwardPaths` in `seed-readiness-gate.dmn`.
- [x] `kg-separation` skill table updated, with why.
- [x] Measured: cat-harness 0 of 134 declared paths upward; folio-assistant-core 0 of 0 (its 5 Tool nodes are shell-invoked — stated in the note so "0" reads as determined).

## Summary of Changes

Closed 2026-10-06 by claude/sep-bookkeeping-s1-s3 (7x5n sweep of in-progress beans whose work has landed). Every Done-when box was already ticked by its holder. That was NOT taken as the evidence: the measurement below was re-run on main at 24b221415 (2026-10-06), and no open PR names this bean.

- `Rule_UpwardPaths` is present in `cat-harness/processes/kg/decisions/seed-readiness-gate.dmn` on main (box 2's rename).
- `bun run gates` on the bookkeeping branch (main + bean edits) is green; it includes the seed-readiness tests.
