---
# folio-assistant-g1oc
$schema: bean/1.0.0
title: 'Land the opt-in collab groups family (backlog G1)'
status: in-progress
type: task
priority: high
created_at: 2026-11-15T07:40:00Z
updated_at: 2026-11-15T07:55:00Z
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
