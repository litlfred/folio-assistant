---
# folio-assistant-tsh9
$schema: bean/1.0.0
title: 'CI speed II (b): red-main cycle from a layer rename; two-phase move rule'
status: todo
type: task
priority: high
tags:
    - ci-speed-ii
created_at: 2026-11-05T08:26:16Z
updated_at: 2026-11-05T08:26:16Z
parent: folio-assistant-k3vv
---

## Evidence
- main red about 250 commits (#2781).
- cat-harness moved `skills/sdlc` to `sdlc/skills`. That move needed fhir-harness#287, folio-assistant-sci#176 and smart-base#303, which were red only because main still pinned the old cat-harness. A dependency cycle across pins.
- 14 re-pin trains in a row failed on the same 7 new failures, each about 110 to 130 runner-minutes: about 17 % of runner time.

## Fix
folio-assistant#2946: carries #2926 and re-pins smart-base past the move.

## Follow-up: a two-phase move rule
For a rename of a path that other layers link to:
1. the moving layer adds the new path and keeps the old one; link checks accept **old or new** for a window;
2. the dependent layers switch to the new path, in any order;
3. the old path is removed once nothing links to it.

So the order in which layers re-pin stops mattering. Belongs in cat-harness (an sdlc skill plus the link checks).

## Done when
- [ ] #2946 merged and main green on its gates
- [ ] the two-phase move rule written as a skill and enforced by the link checks (old and new accepted during the window)

_2026-11-05T08:40:00Z_ — Filed by https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk from the CI-speed analysis of session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf.
