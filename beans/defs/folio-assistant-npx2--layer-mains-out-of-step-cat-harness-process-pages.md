---
# folio-assistant-npx2
$schema: bean/1.0.0
title: 'Layer mains out of step: cat-harness process pages link assets/img/workflows/*.svg, but cat-harness-tools #1504 draws diagrams beside each .bpmn'
status: completed
type: bug
created_at: 2026-11-06T09:21:33Z
updated_at: 2026-11-08T07:17:00Z
parent: folio-assistant-dthl
---

Found 2026-11-06 repinning dth-hrh to every layer's main (dth-hrh#105). With cat-harness-tools main d391194 + cat-harness main 57a1428 (+ other mains), the site build stops at '137 unresolved link(s)': every en/cat-harness/processes/*.html links ../../../assets/img/workflows/<name>.svg, which tools #1504 ('render:bpmn: draw every layer's diagram beside its own .bpmn') no longer writes (run 42192237981). Holding tools at the pre-change narrow pin 3c02503 instead fails check:subgraphs. So no repin alone gets dth-hrh onto the mains; the page links (gen-processes-viz / process page generator, or cat-harness's pages) must follow the drawings, or render:bpmn must still copy them to assets/img/workflows. dth-hrh main stays on its narrow pins (e0a2888), which publish fine.

## Resolution (2026-11-07 / verified 2026-11-08)

- Fixed in `litlfred/cat-harness-tools#1592` (`b76f2a8919a2`, merged `2026-11-07T05:26:48Z` as `33a81d1cb60e`, `processes:viz: copy each drawing a page links into the site being built`): when `scripts/gen-processes-viz.ts` runs with `--site`, it copies each BPMN drawing a process page links (`assets/img/workflows/<stem>.svg`) from beside its `.bpmn` source into the site being built if the site lacks it.
- Verified on `litlfred/dth-hrh#105`: both run `42366701605` (head `d8263e1e160a`, job `128386156185`) and run `42456602682` (head `c04177c4d8fe`, job `128656853124`) passed `Prepare the PR side (and typecheck)` (`success`) with zero unresolved process-page SVG links.

_2026-11-08T07:03:00Z_ — Claimed by agy (92bff8c9-777d-458a-a380-8dd5bf5cc0f3) with bean-claim-check: inactive > 3h, completing verification/close-out in Round 4 drain.
_2026-11-08T07:17:00Z_ — Completed by agy (R4 Lane 6, 67102a1e-8fb4-42a5-a0c5-0047ffb976b0): verified fix in `cat-harness-tools#1592` (`b76f2a8919a2` / merge `33a81d1cb60e`) and green site build on `dth-hrh#105` (runs `42366701605` and `42456602682`).
