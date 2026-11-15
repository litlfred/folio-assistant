---
# folio-assistant-g4rf
$schema: bean/1.0.0
title: 'G4 red-fix: single code PRs with real new failures (2026-11-15)'
status: in-progress
type: task
priority: high
created_at: 2026-11-15T07:25:00Z
updated_at: 2026-11-15T18:02:00Z
parent: folio-assistant-v8bg
tags:
    - pr-backlog
    - handover-2026-11-15
---

Thread "Fix single red code PRs" (cmsg_017WNUkNK8kdDziPK58Pv6G9XQZjrypbgPBc4AKqiSzVWB), group G4 of bean pb15. Owner direction: stack merges, fix afterwards; merge main, never force-push. The merge manager (bean mm15) does every merge.

## State (updated 18:02Z)

| PR | Cause | Action | State / Waits on |
|---|---|---|---|
| tools#2229 (sm8r item 9) | regen-writers render:bpmn:check red control: the PR's render:bpmn reads a mounted layer's drawing over its output-root twin; the test staled the pinned bytes under the twin. Real, test-side. | Pushed 8921437: main merged; the test stales and reads back via readPathAt and removes a twin it caused. | **MERGED** (`496c5e95b8`, `2026-11-15T10:47:01Z`) |
| tools#2130 (sm8r item 4 step 4b) | 215 behind main (owner chose finish, 07:11Z). | Merged main clean; still adds libraries, gen-library-viz, gen-library-jsonld, gen-slice-sqlite, check-navbar-consistency, mount-instance-docs, layer-output test. layer-output.test 26/0 local. | **MERGED** (`3f6222dd63`, `2026-11-15T13:02:19Z`) |
| fhir-harness#426 (excise ig-identity) | fa main pins smart-base 92f38818, before smart-base#401 dropped the ig-identity re-export, so every smart-base tool folder fails to load (23 gates). | None needed in the PR. fa#3124 (`c6c2c6a745`, merged `13:29:42Z`) pinned smart-base 050de3b8 (after #401). | **OPEN** (`MERGEABLE`; pairs with `cat-harness-tools#2182`) |
| smart-base#405 (banner status) | smartTrustStatusIsItsIndexs: smart-trust's banner at the fa main pin still says draft while its index has no status. | Re-run after fa#3124 (`c6c2c6a745`, merged `13:29:42Z`) pins smart-trust main (ig-identity gone). Needs #426 merged and smart-trust's index regenerated with status. | **OPEN** (`MERGEABLE`; waits on `fhir-harness#426`) |
| cat-harness#1329 (open MT) | graph:check-tools: fa main's tools pin c55f2f2b lacks the translation:candidates script (tools#2144). gen:jsonld:check library drift, not in the diff. | fa#3124 pins tools 23778b48, which has it. | **MERGED** (`d41ff7ce99`, `2026-11-15T11:51:43Z`) |
| smart-base#259 (DTH schemas) | bean-bodies (dead-blocker on folio-assistant-kjea) and optin-refs: drift, the PR adds only 3 smart-base files. | Merge main after fa#3124. | **MERGED** (`8f73764bea`, `2026-11-15T15:52:42Z`) |
| smart-pcmt#5 (remove ghbuild) | lock:coherence: its lock pins dth-pc 9af78c51 and dth-sc 79a8b286, behind main. | Merge main after the batched smart-pcmt re-pin (G2, Q-PB-1 A). | **OPEN** (`MERGEABLE`; waits on `smart-pcmt` re-pin) |

## Log
_2026-11-15T07:25Z_ — bean opened; #2229 and #2130 pushed.

_2026-11-15T12:50:00Z_ — Re-parented from pb15 (a task) to v8bg so check-bean-parents passes (merge manager).

_2026-11-15T18:02:00Z_ — 4 of 7 G4 PRs are now MERGED on `main` (`cat-harness-tools#2229` at `496c5e95b8`, `cat-harness-tools#2130` at `3f6222dd63`, `cat-harness#1329` at `d41ff7ce99`, and `smart-base#259` at `8f73764bea`), and `folio-assistant#3124` (`c6c2c6a745`) is MERGED. Remaining open: `fhir-harness#426` (paired with `cat-harness-tools#2182`), `smart-base#405`, and `smart-pcmt#5`.
