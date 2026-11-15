---
# folio-assistant-jjwk
$schema: bean/1.0.0
title: 'Memory: GDHCN "Join the Network" game in smart-trust as a web-app kind; PRs, decisions, translation setup (2026-11-11)'
status: completed
type: task
priority: low
created_at: 2026-11-12T09:45:00Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `onboarding-game-smart-trust.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: GDHCN "Join the Network" game in smart-trust as a web-app kind; PRs, decisions, translation setup (2026-11-11)

GDHCN onboarding game copied into smart-trust/onboarding-game (from carlsbox/gdhcn-onboarding-game bd4c34c). Thread "Add GDHCN onboarding game to smart-trust".

- PRs: smart-trust#178 (issue #176; zero-domain Letter upload issue #177), cat-harness-tools#1864 (web-app kind + web-app-build Tool), cat-harness#1237 (apps visualiser, web-app-publish.bpmn, skill web-apps; issue #1236).
- Decisions: Q-GAME-1/3/4/5/7 = A. Layers declare apps, harness publishes (no per-layer publish scripts). VaxLink retired; journeys is the model. Films kept in repo. Demo captions follow new processes.
- Re-pinned in #183; onboarding-game declared `web-app` in #188 (merged 2026-11-11 09:47Z). #182 renamed GoLive process "Go live" (merged).
- i18n: catalog onboarding-game/src/i18n/en.json (scripts/catalog.mjs); .po at translations/<locale>/apps/onboarding-game.po; French 790/790; ar/es/ru/zh were handed to the coordinator for a translation thread (one PR per locale).
- To do: re-record beat-04 narration (en, fr); GDHCN.ONB.GoLive.bpmn's process name duplicates ConnectTest's (content slip, not fixed).
