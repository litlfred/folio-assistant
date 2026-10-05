---
# folio-assistant-iirv
title: cat-harness / cat-harness-tools separation
status: in-progress
type: epic
created_at: 2026-10-01T06:58:00Z
updated_at: 2026-10-01T06:58:00Z
parent: folio-assistant-vuip
---

Owner, 2026-10-01: "make sure workplan properly beaned and status trackable" for the cat-harness / cat-harness-tools separation arc. This epic is the one place that answers "where is the separation up to": every stage of the split plan and every placement PR still to do is a child, ordered by `blocked_by`.

**What it delivers:** `cat-harness/` becomes two repositories — litlfred/cat-harness (content: the KG, no code) and litlfred/cat-harness-tools (all code: scripts, src, adapters, pipeline, Zod) — carried here as submodules at the same paths, after the placement programme (PR0–PR9) has moved every higher-instance subject out of the harness. Method: `kg-separation` (`cat-harness/skills/kg/graph-management/kg-separation.md`, `processes/kg-separation.bpmn`), with bootstrap / bootstrap-tools (`xsqm`, completed) as the worked example.

Plans (session scratchpad, 2026-10-01; to be committed with stage 0): `cat-harness-split-plan.md` (stages 0–6, decisions D1–D6, "Owner rulings, 2026-10-01") and `placement-proposal.md` (PR0–PR9, §6 "Owner rulings, 2026-09-30").

Owner rulings, 2026-10-01 (split plan):
- **D1** — ALL cat-harness code moves to cat-harness-tools (widens `w2gr`). A dependent instance's code may import anything in its dependency chain, cat-harness-tools included; the import-direction gate forbids only upward edges.
- **D2** — option 1: `.ts` content (block manifests, `defineTool` definitions, `SkillDefinition` files) becomes JSON data; generated `.jsonld` byte-identical; a gate fails on code in content.
- **D3** — option 2: each instance hosts the generated outputs about itself (not the checkout root).
- **D4** — option 3: interleave — stage 1a now; placement PR2–PR8; then stages 1b–1d.
- **D5, D6** — defaults: the site is built from the folio-assistant checkout at the current URL; `fsh-guts` keeps a manifest naming the source commit, no tarball.

Placement rulings, 2026-09-30 (placement proposal §6): content-lifecycle A (harness, generalised; the 7 definitions come back down); materialization A plus "subscribing to a remote KG materializes it" under `library/<source>/`; library sources A (`library/<group>/<slug>/`); schemas above the harness **B — move now with their importers**; tests A (`scripts/tests/<group>/`, `test/<group>/`); tools may describe their own subprocesses; process: review → resolve issues → staged PRs.

Order (D4, option 3 — interleave), as encoded in `blocked_by`:
PR0 (`ejye`) + PR1 (`ybwt`) → stage 0 → stage 1a → PR2 … PR8 (PR7/PR8 retargeted to `cat-harness-tools/`) → stages 1b → 1c → 1d (after PR9) → 2 → 3 → 4 → 5 → 6.

## Already landed (children, completed)
- bootstrap / bootstrap-tools split — `xsqm` (closed 2026-10-01 on evidence; stays under `vke6`, the #223 split epic, because its siblings are the other layer cuts)
- Option A, subgraphs inherit as named members — `1g4s` (#1722)
- `readme:toc` — every harness README has its own TOC (#1731)
- `check:import-direction` — cat-harness imports nothing above it (#1737; the gate `p11x` asked for)

## In flight, not yet on main
- Placement PR0 mechanisms — `ejye` (branches `pr0-mechanisms`, `next/cdn-pr0`; parent `9umr`)
- Placement PR1 content-type packages up — `ybwt` (branch `pr1-content-up`; parent `9umr`)
- render-kg-to-cdn — child of this epic
- the code half itself — `w2gr` (widened per D1; child of this epic)

`ejye` and `ybwt` are not on main yet, so the stage-0 and PR2/PR3 beans name them in their bodies rather than in `blocked_by` (the CLI cannot link an id the store does not hold). Add the links when those beans land.

## Related beans
`9umr` (eight concern groups; parent of PR0/PR1), `p11x` (partition gate), `yj6r` (15 instance-boundary import escapes), `ybp4` / `y5si` (adapters closure), `0lj4` (cat-harness ↔ bootstrap-tools `needs`), `bf5l` (first wrong-direction import), `3r47` (graph classes dropped), `cmsl` (PR0a's dedupe), `zhg2` (reference direction for all instances), `iwtn` (bootstrap self-definitional mentions), `xies` (publish to CDN), `vke6` (#223 split), `vuip` (GOAL 1).

## Done when
- [ ] every child is completed or scrapped with reasons
- [ ] `cat-harness/` and `cat-harness-tools/` are submodules pinned to seeded SHAs, and `bun run gates --all` matches the pre-cutover run gate for gate
- [ ] a link/import audit over `cat-harness/` alone finds 0 upward references and 0 code files
