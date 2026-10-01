---
# folio-assistant-fnx4
title: 'KG SUBSCRIPTIONS: subscribe to an external KG, materialise chosen subgraphs, assets and harnesses; known substrates; visualizer'
status: in-progress
type: epic
priority: normal
created_at: 2026-09-30T22:54:31Z
updated_at: 2026-10-01T08:15:15Z
parent: folio-assistant-vuip
---

Issue #1719. Proposal: `cat-harness/docs/proposals/kg-subscriptions.md`.

Owner, 2026-09-30: subscribe to external KGs (bootstrap-conformant, with at least one harness); materialise some or all subgraphs and assets; instantiate harnesses so they reach the navbar; list known substrates in cat-harness; a visualizer; an MVP inside the folio separation.

## Done when
- [x] 1 schema: `subscriptions` on the declaration, with QA
- [x] 2 known-substrates registry (derived rows plus hand rows with `status`), with a `:check`
- [x] 3 visualizer page, generated and read-only
- [x] 4 subscribe tool: validate a substrate's declaration at a pin
- [ ] 5 materialise a subgraph through `Process_MaterializeRemote`
- [ ] 6 materialise an asset on demand
- [x] 7 instantiate a harness from a subscription, so it appears in the navbar
- [x] 8 process, skill and scenarios registered
- [ ] first real subscription: `litlfred/ihris`

Slice 7 (branch claude/magical-archimedes-4qkfxp-kg-instantiate): `bun run kg:instantiate <subscription> <harness>` writes `<harness>.config.json` and the harness's state directories (under `<harness>/`) from the cached snapshot; refuses unchosen, undeclared, unmet-needs and name-taken cases; could-not-determine for a missing snapshot or unregistered kinds. harness-tiles draws the tile from the snapshot (scripts/subscribed-harnesses.ts), check-instance-config counts the config as claimed, subscriptions-viz marks it instantiated. Proven on fixtures only; check:instance-render does not cover a subscribed harness until its subgraphs are materialised. No real config committed: the first real subscription is the owner's step.


## 2026-10-01 — separation arc (7x5n, S1)
Boxes 1–4 and 8 ticked on evidence: #1721 (slices 1–4, 7, 8) merged as cdb0a018. Slices 5+6 are #1756 (arc S3). Open before the first real subscription: slice-7 layout collides with staged instance dirs (arc gap G11).
