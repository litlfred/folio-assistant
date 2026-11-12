---
# folio-assistant-pblp
$schema: bean/1.0.0
title: 'Memory: 11-12 "Stop the CI failure email alerts" thread: 120 emails traced, cause classes A–L, fix PRs, re-run amplification'
status: completed
type: task
priority: low
created_at: 2026-11-12T06:29:34Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `ci-email-storm-2026-11-12.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: 11-12 "Stop the CI failure email alerts" thread: 120 emails traced, cause classes A–L, fix PRs, re-run amplification


Thread cmsg_017WNUkNK8kdDziPK58Pv6G96etWUsHcNFgYZFJZ29PDz9 (user 06:03Z 11-12: "EXHAUSTIVE solution, WAY too spammy"). Table: Library ci-email-storm-2026-11-12/ci-email-causes.md. Umbrella issue cat-harness-tools#1931.

- 56/120 emails were re-runs (Attempt #2/#3); ~30 PRs re-run at once ~22:00Z during a GitHub artifact/runner outage. All agents act as litlfred, so every failed run emails him.
- Layer mains (main-qa "Keep the main-red issue in step") judge at folio-assistant lock pins; fa lock last re-pinned 13:42Z 11-11; trains time out in Jekyll stage (who-iris references, core#760). Fixes on layer mains don't stop red-main emails until a re-pin lands.
- My PRs (draft, handed to merge manager): tools#1932 check:upstream-pins → LIVE_STATE_SCRIPTS in run-gates.py (21 smart-ra emails); tools#1933 stage-local SupersededError exit 0; tools#1934 compose-docs real-tree budgets; tools#1935 kind-table unlinkOptIn; cat-harness#1259 apps builtAtPublish + Process_WebAppPublish doc chatter; folio-assistant#3086 archived bean links (base cat/cat-harness/beans).
- Others' fixes in flight: tools#1928/#1905/#1930/#1916, core#760, smart-base#347/#349/#346, smart-trust#198, smart-trust-demo#128.
- Threads can't force-push (classifier refuses); add follow-up commits instead. Local tools tests: link bootstrap-tools/cat-harness into /home/user/node_modules/@litlfred and run bun test from a dir without bunfig, CAT_HARNESS_ROOT set.
- Later fix PRs: tools#1936 (web-apps:build skips unmounted app; unblocks cat-harness#1259 after re-pin), #1937 (regen-writers render case), #1938 (resolution-across-needs + attribution budgets), #1941 (Q-TMO-1 A 30 s default). Q-RERUN-1 = B (re-run only right before merge).
- ROOT CAUSE of 5 s test flips: bun 1.4.4 applies a preload's setDefaultTimeout ONLY to the first test file; bunfig [test] timeout is ignored. #1941 adds a loader plugin in schemas/test-preload.ts. Comments in tools must not name higher layers (check:reference-direction).
- tools main reds 11-12 (libraries zod, render:bpmn) = fa lock skew (bootstrap-tools pin 9f478d4 vs b31c534), cleared by re-pin; fhir-harness#384 has the yaml fix.
Related: folio-assistant-bzry, folio-assistant-vugr.
