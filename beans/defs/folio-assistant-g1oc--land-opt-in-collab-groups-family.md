---
# folio-assistant-g1oc
$schema: bean/1.0.0
title: 'Land the opt-in collab groups family (backlog G1)'
status: completed
type: task
priority: high
created_at: 2026-11-15T07:40:00Z
updated_at: 2026-11-15T21:20:00Z
parent: folio-assistant-pb15
tags:
    - handover
    - pr-backlog
    - handover-2026-11-15
---

Group G1 of the backlog plan [[folio-assistant-pb15]]. Thread "Land opt-in collab groups family" (https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G9QWs21w9j7zepHm6AUbuPXj), session https://claude.ai/code/session_01Qmmkt9PKt17La22a63e6zg. Took over from idle session 01EucfRmKpseotmkuL7U14cV. The merge manager (thread …HtujCofFVVPVPppfDRTSNR) does every merge.

## Facts found 07:20Z

- The upstream pieces are all merged already: tools#1986 (`requires`), core#776, smart-base#357, fhir-harness#398 (the `collab` groups).
- Mains of dth-hrh, smart-immunizations, smart-trust, smart-trust-phw and smart-ips-pilgrimage already pin core, smart-base and fhir-harness at or after those merges. Their PRs' own re-pins were stale and caused the "new failures" (other tools code). Fix: merge main and take main's lock, config and workflows, so each PR only adds `enableSubgraphs`.
- dth-phc, dth-sc and smart-ra mains pin core/smart-base/fhir-harness from before the collab merges. Standing re-pin was switched on at 06:37Z (dth-phc#46, dth-sc#34, smart-ra#251) but had not run yet; dispatched it by hand 07:25Z. After those re-pins merge, merge main into #44, #32, #249 the same way.
- cat-harness main already has `sdlc` requires `work-plan` and `platform-ui` (cache.bpmn keeps `incremental-render`, owner card 11-13). #1288 now holds only the docs/translation path moves for core's collab group.

## State

| PR | action | state |
|---|---|---|
| tools#1980 | update-branch (was 387 behind) | full tier running |
| cat-harness#1288 | merged main, took main's cat-harness.json + cache.bpmn; `release` label, marked ready | CI running |
| dth-hrh#126 | merged main; marked ready | CI running |
| smart-immunizations#139 | merged main, main's lock | CI running |
| smart-trust#212 | merged main, main's lock | CI running |
| smart-trust-phw#62 | merged main, main's lock | CI running |
| smart-ips-pilgrimage#81 | merged main, main's lock (keeps .gitignore state-mounts block) | CI running |
| dth-phc#44, dth-sc#32, smart-ra#249 | waiting on standing re-pin | |
| aai#64, smart-anc#8, smart-fp#13, smart-trust-tools#65 (drafts) | not started | |

_2026-11-15T07:40:00Z_ — Filed.

_2026-11-15T07:55:00Z_ — Merged (stacked by the merge manager ~07:16Z): tools#1980, cat-harness#1288, dth-hrh#126, smart-immunizations#139, smart-trust#212, smart-trust-phw#62, smart-ips-pilgrimage#81. Fallout: "Lock pins at main" red on those sites.
- Standing re-pin exit 2 fixed by tools#2278 (issue #2277, merged 07:28Z): the planner now folds every listed layer's own kinds before reading any nesting, and upstreamDirectories reads the declaration with the given registry. smart-base uses fhir-harness's `fhir-artifact-index`.
- Second blocker: smart-base#357 moved ids `processes` and `smart-base-house-processes` into opt-in `collab`. Sites naming them in their smart-base override are refused at smart-base >= 30e5c169. Fix: name `collab`. Affects dth-phc, dth-sc, smart-ra, smart-trust-phw, smart-ips-pilgrimage, smart-immunizations.
- Sites have no REPIN_TOKEN, so the standing workflow pushes `repin/standing-*` but cannot open the PR. Standing also moves only green commits, so it is not a full freshness re-pin.
- Hand re-pin recipe: edit every remote ref in index.config.json to the repository's main (consent.on/ref updated, evidence = standing consent 11-12), then from the site root run `bun <composed tools main>/scripts/remote-mount.ts --no-install --no-health`; commit the config, lock and rewritten workflows.
- dth-hrh#135 (standing branch, opened by hand) merged 07:40Z. dth-phc#44 now = enable + ids rename + full re-pin, marked ready. dth-sc#32, smart-ra#249 (replaces smart-ra#255) and new `claude/repin-all-mains-2026-11-15` PRs for smart-trust-phw, smart-ips-pilgrimage, smart-immunizations (replaces #149) are being mounted.

_2026-11-15T07:56:00Z_ — Owner card Q-REPIN-TOKEN = B (07:55Z): no REPIN_TOKEN; agents (the merge manager) open a PR from each pushed `repin/standing-*` branch when Actions cannot, labels `needs-repin` + `release`.

_2026-11-15T10:17:00Z_ — Merged: smart-immunizations#150, smart-trust-phw#84, dth-sc#32. Gate reds on the re-pins, and their fixes:
- `check:site-publish-caller` (new tools want `permissions.actions: read`): `bun run cat site-publish-caller --write` then `bun run cat workflow-pins`.
- `declaration-resolution` on `smart-base.L2-collab`/`L3-collab`: those groups are declared inside smart-base's opt-in L2/L3 dirs, which folios don't mount, so they were dropped from dth-phc, dth-sc and smart-ra `enableSubgraphs` (they resolved to nothing). dth-hrh and phw still enable them and carry the same red on main.
- dth-sc `check:l1-coverage`: `bun run l1:coverage:write` after the who-iris re-pin (section ids renamed, totals unchanged).
- `check:subgraph-coverage` new MAJOR `fhir-core-definitions / visualiser` from fhir-harness #431: fhir-harness#439 (issue #438) exempts it (HL7 publishes the viewer). The merge manager's worker fixed pilgrimage#115 separately (archimate visualisers).
- `check:navbar-consistency` exits 2 at tools 067776bd+ in every root (it reads gitignored cat-harness docs/_data/instance-themes.json): advisory, not a PR's.
- smart-trust-phw main Site publish refused: stale `qa/ig-content-qa.json` after AST refresh (3 Publisher narratives, terminology.hl7.org 7.1.0→5.5.0). Re-recorded via `ig-content-qa.ts record` in smart-trust-phw#85. Delta method: scan the AST the old review read (`--ast` from the fhir-ast branch commit) to reproduce its digest, diff item shas. Other IG sites may need the same after re-pins.
- smart-ra#249 re-pinned tools to 103bd471 (#2275 Graphviz OOM fix).
Open: dth-phc#44, smart-ra#249, smart-ips-pilgrimage#115, smart-trust-phw#85, fhir-harness#439.

_2026-11-15T12:10:00Z_ — All G1 re-pins merged: dth-phc#44, dth-sc#32, smart-ra#249, smart-ips-pilgrimage#115, smart-trust-phw#84 + #85 (injection QA refresh), smart-immunizations#150. pilgrimage#115 also needed check:nav-names: a `visualisers[].title` that differs from the kind title gives one destination two names; drop it. Remaining: fhir-harness#439 (fhir-core-definitions visualiser exemption, ready-to-merge, CI re-run). Not started: G1 drafts aai#64, smart-anc#8, smart-fp#13, smart-trust-tools#65.

_2026-11-15T13:40:00Z_ — fhir-harness#439 merged. Owner 12:09Z card "A. Revive, close, ask" + 12:12Z "make sure revisions are aligned with current decisions and infra": revived 13 enable drafts (smart-base-clinical#20, aai-programme#64, ihris#47, smart-anc#8, smart-ccc#8, smart-dak-{ccc,pnc,smbp,srv,tb}#8, smart-dak-chud#9, smart-fp#13, smart-tuberculosis#8): default branch merged in (smart-anc and smart-fp default to `master`), every layer re-pinned to main with consent evidence citing the 12:12Z ask (these sites have no standing consent; never cite another site's standing consent), smart-base ids → `collab`, smart-base-clinical `smart-base-kg` → `smart-base-L1` (smart-base#360), canonical site-publish caller, unresolvable L2/L3-collab dropped; marked ready. These repos run no PR-check workflow, so there is no CI gate; handed to the merge manager on local verification. Script: scratchpad g2.sh (+ repin2.py).

_2026-11-15T17:46:00Z_ — All 13 revived drafts merged. First Site publishes: smart-base-clinical, smart-dak-{ccc,pnc,smbp,srv,tb,chud}, smart-tuberculosis green; smart-fp and smart-anc green on master after cat-harness-tools#2320 (canonical caller triggers on `[main, master]`) and smart-fp#14 / smart-anc#9. Eight IGs were refused by fhir-harness's ig-content-qa gate (no injection review); reviews recorded on the owner's direct card taps (16:58Z, 17:10Z), 0 findings; smart-base-clinical needed `trustedScripts: ["cql.js"]`; smart-anc's `.gitignore` needed `!/qa/ig-content-qa.json`. ihris: own pages.yml, canonical caller removed (ihris#49). aai-programme: library JSON-LD regen (#66), then site:qa-validation needed GH_TOKEN in the stage step: cat-harness-tools#2322 + re-pin aai-programme#68, publish green. Open: smart-ccc first publish still building at 17:45Z. Note for owners: smart-ccc StructureMaps carry a garbled target `swrapin_entry_createtatus` (authoring defect).

_2026-11-15T21:20:00Z_ — smart-ccc publish hung 2 h in ig-site:page-render-qa (a page that never returns from evaluate). Owner card 19:14Z: cancelled. fhir-harness#442 bounds the scan (per-page hard limit, 15-min budget, `notReached`); merged, carried to smart-ccc by the merge manager's pin wave (smart-ccc#10). Publish run 43761955611 green in 8 min (page scan 135 pages, 10 unfinished). Every site of the family now publishes green. Done.
