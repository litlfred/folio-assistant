---
# folio-assistant-g4rf
$schema: bean/1.0.0
title: 'G4 red-fix: single code PRs with real new failures (2026-11-15)'
status: in-progress
type: task
priority: high
created_at: 2026-11-15T07:25:00Z
updated_at: 2026-11-15T07:25:00Z
parent: folio-assistant-pb15
tags:
    - pr-backlog
    - handover-2026-11-15
---

Thread "Fix single red code PRs" (cmsg_017WNUkNK8kdDziPK58Pv6G9XQZjrypbgPBc4AKqiSzVWB), group G4 of bean pb15. Owner direction: stack merges, fix afterwards; merge main, never force-push. The merge manager (bean mm15) does every merge.

## State 07:25Z

| PR | Cause | Action | Waits on |
|---|---|---|---|
| tools#2229 (sm8r item 9) | regen-writers render:bpmn:check red control: the PR's render:bpmn reads a mounted layer's drawing over its output-root twin; the test staled the pinned bytes under the twin. Real, test-side. | Pushed 8921437: main merged; the test stales and reads back via readPathAt and removes a twin it caused. | CI |
| tools#2130 (sm8r item 4 step 4b) | 215 behind main (owner chose finish, 07:11Z). | Merged main clean; still adds libraries, gen-library-viz, gen-library-jsonld, gen-slice-sqlite, check-navbar-consistency, mount-instance-docs, layer-output test. layer-output.test 26/0 local. | CI |
| fhir-harness#426 (excise ig-identity) | fa main pins smart-base 92f38818, before smart-base#401 dropped the ig-identity re-export, so every smart-base tool folder fails to load (23 gates). | None needed in the PR. fa#3124 pins smart-base 050de3b8 (after #401). | fa#3124, then merge main |
| smart-base#405 (banner status) | smartTrustStatusIsItsIndexs: smart-trust's banner at the fa main pin still says draft while its index has no status. | Re-run after fa#3124 pins smart-trust main (ig-identity gone). If still red, it needs #426 merged and smart-trust's index regenerated with status. | fa#3124, fhir-harness#426 |
| cat-harness#1329 (open MT) | graph:check-tools: fa main's tools pin c55f2f2b lacks the translation:candidates script (tools#2144). gen:jsonld:check library drift, not in the diff. | fa#3124 pins tools 23778b48, which has it. | fa#3124, then merge main |
| smart-base#259 (DTH schemas) | bean-bodies (dead-blocker on folio-assistant-kjea) and optin-refs: drift, the PR adds only 3 smart-base files. | Merge main after fa#3124. | fa#3124 |
| smart-pcmt#5 (remove ghbuild) | lock:coherence: its lock pins dth-pc 9af78c51 and dth-sc 79a8b286, behind main. | Merge main after the batched smart-pcmt re-pin (G2, Q-PB-1 A). | smart-pcmt re-pin |

## Log
_2026-11-15T07:25Z_ — bean opened; #2229 and #2130 pushed.
