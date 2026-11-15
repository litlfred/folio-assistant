---
# folio-assistant-mm15
$schema: bean/1.0.0
title: 'Merge manager handover 2026-11-15 06:35Z'
status: in-progress
type: task
priority: high
created_at: 2026-11-15T06:35:00Z
updated_at: 2026-11-15T06:36:00Z
parent: folio-assistant-v8bg
tags:
    - handover
    - merge-manager
---

Merge manager thread: cmsg_017WNUkNK8kdDziPK58Pv6G9HtujCofFVVPVPppfDRTSNR (session_01Qmmkt6te9q7bF3KBT2Qq11). Helpers: /mnt/project-files/merge-manager/handover/ (m.sh, lk.sh, render-watch.sh, HANDOVER.md running log). Re-check every PR live before acting.

## Window and rules
- Owner card tapped 2026-11-15 06:26Z: "12h window, incl. #238". Runs to about **18:26Z 11-15**. Scope: re-pins, green non-content PRs, smart-trust#238. Content still needs its own owner card.
- Q-LOCK-1 A (lock:coherence-only red OK on approved code PRs, comment citing it). Q-RA-VAL-2 A (smart-ra corpus-gate waived). Q-RERUN-1 B (re-run only right before merge, once per job). Full tier required (label `release` BEFORE ready).
- A second merge session (cshk_01VQDpPffYARDQ8juksAZScf, outside this project) is also merging and is holding layer merges until train **fa#3124** lands so its pins stay fresh. Coordinate: do not merge layer PRs that move mains the train pins until #3124 is in.

## Merged since 11-14 16:00Z (by someone)
tools #2184 #2187 #2195 #2197 #2202 #2216; cat-harness #1342 #1343; bootstrap-tools#100; fhir-harness#435; smart-base #407 #410; phw #79 #80; imm#146; pilgrimage#110; dth-hrh#133; smart-hiv#30 (me, 06:30Z).

## Merge order once fa#3124 lands
1. fa#3124 (train; 03e2ce9d, CI running) — needs fa#3127 (red, its base is the train) folded in.
2. smart-ra drafts #154 #185 #190 #191 #192 #195 — red only corpus-gate + lock:coherence (verified 06:30Z, New failures 0): merge under Q-RA-VAL-2 A + Q-LOCK-1 A. Close smart-ra#241 (superseded by #250).
3. Standing re-pin config (Q-BIBNAV-2 B), lock-only red: smart-ra#251, dth-sc#34, dth-phc#46 — Q-LOCK-1 A.
4. smart-trust#238 (trustlist.jsonld syntax; marked ready 06:30Z, full tier pending).
5. smart-immunizations-uganda#39 re-pin: red lock + bun-pin + content-code-free (pin skew) — refresh pins after #3124, then merge.
6. Conflicted, need refresh after #3124: smart-trust#236, smart-immunizations#145.
- tools#2199 then cat-harness#1341 (move tests; owner picked A 06:26Z): gate-fix thread hands them over; merge #2199 first. Close tools#2185 (exemption, not chosen).
- Held for owner: who-iris#279 then #284 (content: IRIS re-derives, WHO errata) — owner card after green; red now is pin skew (needs #3124).

## Site publish state (render watch 05:40Z)
Live: smart-trust (05e9d55d 11-14 23:06Z, game at /en/cat-harness/apps/onboarding-game/), smart-base, phw. Red/stale: smart-immunizations (needs #145), uganda (needs #39). Mains red on post-merge QA (core, who-iris, fhir-harness, smart-base) are pin skew that clears with fa#3124 (gate-fix thread …BNSixgF4DaasKpgTGfx9vA, bean gm5f).

## Sibling threads feeding this queue
publish-on-push …GSmgusK4K8TCWBQfu5rM7S (smart-trust/uganda/imm publish); gate fixes …BNSixgF4DaasKpgTGfx9vA (gm5f); smart-ra drafts …6fbDk8ZG5kaLTpD1m7m7RP; standing re-pin/biblio …G6g9EGbG9kGSg8u3W5fieF; IRIS source fixes …3WQmGmifCFfexR63a3h4wh (who-iris#279/#284).

_2026-11-15T06:35:00Z_ — Filed by the merge manager thread.

_2026-11-15T06:31:00Z_ — Owner chose A for tools#2199 (move tests); #2185 not taken.

## IRIS source fixes (…3WQmGmifCFfexR63a3h4wh), via coordinator 06:30Z
who-iris#279 conflict resolved at bb54e27d, CI running; #284's errata folded into #279. Needs an owner content card once green. Persian OCR card (A/B/C) still open with the owner.

## Carried from project memory (owner rule: beans only)
- smart-ra drafts (memory smart-ra-drafts-green-2026-11-12): 21 smart-ra PRs; waived set (Q-RA-VAL-2 A) #154 #185 #190 #191 #192 #195 had main merged 11-14 16:05Z. The rest are held for owner review with no pushes. #195 keeps its §1.1.4 audience items (Q-RA-MRG-1 A). #199's glossary union merge (6a194c49) exists only in a sandbox and was never pushed. #241 is superseded by re-pin #250 (merged).
- smart-trust-phw BPMN labels (memory bpmn-label-tidy-square-tasks): bootstrap-tools #87/#88 merged; Q-SQ-1 C (square = equal task boxes 120x120), Q-BPMN-FIX-1 B (phw#61 ready for owner OK, redraws in fhir-harness#388, cat-harness#1254, core#757, bootstrap#54, ihris#46). Check with cat-harness-tools scripts/bpmn-detangle.ts.

_2026-11-15T06:36:00Z_ — Added IRIS status and carried the smart-ra / phw memory notes into this bean.
