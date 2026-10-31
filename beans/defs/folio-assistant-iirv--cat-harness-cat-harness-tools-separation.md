---
# folio-assistant-iirv
$schema: bean/1.0.0
title: cat-harness / cat-harness-tools separation
status: in-progress
type: epic
priority: normal
created_at: 2026-10-01T06:58:00Z
updated_at: 2026-10-31T17:05:00Z
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
- [ ] `cat-harness/` and `cat-harness-tools/` are submodules pinned to seeded SHAs, and `bun run cat gates --all` matches the pre-cutover run gate for gate
- [ ] a link/import audit over `cat-harness/` alone finds 0 upward references and 0 code files

## State 2026-10-09
**The cut happened, by remote mount rather than submodule.** cat-harness and cat-harness-tools left main on 2026-10-08 (commits 283ba67e, fc645ae1; PR #2517), seeded as one commit each (`iai8`), archived to `fsh-guts/separated/`, and remote-mounted through `index.config.json` / `index.lock.json`.
Children: completed — `ho66`, `iai8`, `70lx`, `y9r6`, `63wl`, `tlat`, `apcg`, `ejye`, `w2gr`; scrapped today — `syzb` (submodules superseded); `smbc` tagged `ready-to-close` (owner's quote); open — `pzwb`, `4fv8`, `8fq9`, `f8wp`, `p9bu`, `8lcl`, `vj2p`, `w1gy` (each has a 2026-10-09 note where I measured it).
Done-when, re-read against the new design:
- Box 2 names submodules; the owner replaced that with remote mounts (`0mpw`, `w0at` amendment). Read as "both are remote mounts pinned to seeded SHAs", that half **is met** (`check:index-ignores` ✓, `index-config:migrate:check` ✓). Its gate-for-gate falsifier is not: the standalone ratchet is one entry red at the current pin (see `w1gy`).
- Box 3 **not met**: 1721 code files under the mounted cat-harness (`find` for .ts/.js/.py/.sh), and `check:reference-direction` counts 4229 wrong-direction name occurrences with cat-harness as the source (imports are 0).
- Carried forward from `syzb`: `cat-harness/docs/concepts/architecture/migration-plan.md` §Phase II still has no pointer to `kg-separation`.
Session https://claude.ai/code/session_017QXvm7c7RDYFguWzSxhrMb.


## 2026-10-12 — cutover is now measured, not assumed (session https://claude.ai/code/session_017fFnGmbJcfqqrHXz9oqxdG, owner tasks 6 and 7)
- **`separation:cutover:check`** (Tool `separation-cutover-check`): the gate after stage 13 in `processes/kg/kg-separation.bpmn` (`GW_CutoverComplete`). It checks six conditions: mounts, declarations, monorepo-paths, import-direction, reference-direction, and site. It answers for one separated repository; findings in mounted layers are listed but not counted.
- **`check:declaration-resolution`**: every path a declaration names resolves, covering directories, assets, visualisers and needs.
- **Registry defect fixed:** kinds are now read from the checkout under inspection (lesson 6/19).
- PRs: definitions in cat-harness#182 (merged); implementations in cat-harness-tools#170.
- **cat-harness-tools as a lone checkout is NOT cut over by this measure:**
  - its `needs` (cat-harness, bootstrap-tools) do not resolve without the index;
  - 90 wiring references remain into `folio-assistant/`.
  - Both bear on done-when box 2.

_2026-10-30T20:37:00Z_ — Placement PR2–PR9 (`pzwb`, `63wl`, `4fv8`, `tlat`, `apcg`, `8fq9`, `f8wp`, `p9bu`) and `vj2p` are now all `completed`, and both `check:import-direction` and `check:reference-direction` report **0 wrong-direction** across `cat-harness` (and across all 12 instances in `folio-assistant` at `27d72c8d91`). Remaining open children under `iirv`: `8lcl` (generated JSON Schema half in flight in `cat-harness#794` + `cat-harness-tools#995`), `w1gy`, and `ygge`.

_2026-10-31T08:35:00Z_ — `folio-assistant-8lcl` (stage 1b) and `folio-assistant-txue` (S5) are now `completed` (`cat-harness#794` and `cat-harness-tools#995` merged on `main`; `check:content-code-free` at 0 code files; `kind:json-schemas:check` and `check:node-iris` green). Remaining open children under `iirv`: `w1gy` and `ygge`.

_2026-10-31T15:35:00Z_ — `folio-assistant-ygge` (F17) and `folio-assistant-w1gy` (stage 5 fresh-clone QA, plus `mgxw`) are now both `completed` (`cat-harness#853` `02c4725`, `bootstrap-tools#55` `541195a`, `cat-harness-tools#1121` `0bf6efb`, `bootstrap-tools#58` `72344e1`, and `cat-harness-tools#1131` `9da064c` merged on `main`, with 0 tsc errors and 0 test failures outside the baseline in a fresh sibling clone). Reference-direction follow-ups: [`litlfred/cat-harness#864`](https://github.com/litlfred/cat-harness/pull/864) (`001f764`, naming higher layers by URL or role in `repo-conversion` and `hand-back-to-discussion`) merged on `main`; open PRs on `cat-harness-tools`: [`litlfred/cat-harness-tools#1160`](https://github.com/litlfred/cat-harness-tools/pull/1160) (`330ddf1`, dropping two `who-iris` mentions and marking `state.jsonld` as generator output), [`litlfred/cat-harness-tools#1151`](https://github.com/litlfred/cat-harness-tools/pull/1151) (`3c12af1`, removing two upward layer mentions in `graph-typology-registry.ts` comments), and [`litlfred/cat-harness-tools#1142`](https://github.com/litlfred/cat-harness-tools/pull/1142) (`c6c20ac`, repairing `cat-tools-g7ls` `status: done` → `completed` and skipping generated `README.md` in bean readers). 29 of 30 children under `iirv` are now `completed`; the sole remaining open child is `folio-assistant-6fez` (`Library sources regroup: cat-harness/library/ into library/<group>/<slug>/`, split from `f8wp`).
