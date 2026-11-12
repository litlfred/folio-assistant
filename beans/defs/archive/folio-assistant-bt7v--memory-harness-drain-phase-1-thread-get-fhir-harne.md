---
# folio-assistant-bt7v
$schema: bean/1.0.0
title: 'Memory: Harness drain phase 1 (thread "Get fhir-harness main green"): root cause of cancelled main runs in every layer, PRs tools#1384 and fhir#273, card Q-H...'
status: completed
type: task
priority: low
created_at: 2026-11-02T06:53:01Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `fhir-harness-main-green-2026-11-02.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Harness drain phase 1 (thread "Get fhir-harness main green"): root cause of cancelled main runs in every layer, PRs tools#1384 and fhir#273, card Q-HDR-2


Thread cmsg_017WNUkNK8kdDziPK58Pv6G9AUUziBnkaEddnAivQBoG8h, started 2026-11-02 06:47Z, child of drain thread …93tgDz3qufiWhn4SHZH4bHs (see folio-assistant-6pek).

Root cause (all layers using layer-pr-checks.yml): on `pull_request: closed`, github.ref is the BASE branch, so a merged PR's closing run joined main's group `layer-pr-checks-<repo>-refs/heads/main` with cancel-in-progress true (pull_request) and cancelled main's running push run AND the new push run. Annotation: "higher priority waiting request". pr-tests.yml had the same fix already.
- tools#1384 (draft): group keyed by PR number; report.py judges a cancelled run by a green/red VERDICT. report.py runs at the tools commit folio-assistant's index.lock.json pins (fhir-harness has no lock), so that half needs a re-pin; the concurrency half is live at tools main (callers use @main).
- fhir#273 (draft): #271 option A, optional peer dep; tested with bun 1.4.4 isolated linker.
- Pushing .github/workflows changes to cat-harness-tools WORKED from this session (despite "workflows permission not granted").
- Q-HDR-2 sent to drain thread (A: mark both ready, merge #1384 then #273; #273's merge tests the fix and should close fhir#269).
- 07:03Z fhir#273 merged inside meta-merge fhir#274; #271 closed. Meta-merge main run cancelled by closed-PR runs, as predicted.
- 08:49Z main run 41403829696 (attempt 2) FINISHED: all gates passed, but main-qa red because fhir-harness has no .github/main-qa-gates.json (all 318 root gates judged; 18 reds are lower layers + publish:derive:publish). fhir#276 declares fhir-harness:* + graph:fhir-harness:* (like sci). Cards in this thread: Q-FHM-1 (merge tools#1384; merge API refused on the drain thread's relayed tap) and Q-FHM-2 (A own gates).
- DONE 11:00Z: tools#1384 merged 10:07Z (Q-FHM-1 A tap), fhir#276 merged (Q-FHM-2 A), main 4dc8571 run 41429364740 green, fhir#269 closed by bot. Thread resolved.
