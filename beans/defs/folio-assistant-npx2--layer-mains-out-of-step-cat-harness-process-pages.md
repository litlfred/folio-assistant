---
# folio-assistant-npx2
$schema: bean/1.0.0
title: 'Layer mains out of step: cat-harness process pages link assets/img/workflows/*.svg, but cat-harness-tools #1504 draws diagrams beside each .bpmn'
status: in-progress
type: bug
created_at: 2026-11-06T09:21:33Z
updated_at: 2026-11-08T07:03:00Z
parent: folio-assistant-dthl
---

Found 2026-11-06 repinning dth-hrh to every layer's main (dth-hrh#105). With cat-harness-tools main d391194 + cat-harness main 57a1428 (+ other mains), the site build stops at '137 unresolved link(s)': every en/cat-harness/processes/*.html links ../../../assets/img/workflows/<name>.svg, which tools #1504 ('render:bpmn: draw every layer's diagram beside its own .bpmn') no longer writes (run 42192237981). Holding tools at the pre-change narrow pin 3c02503 instead fails check:subgraphs. So no repin alone gets dth-hrh onto the mains; the page links (gen-processes-viz / process page generator, or cat-harness's pages) must follow the drawings, or render:bpmn must still copy them to assets/img/workflows. dth-hrh main stays on its narrow pins (e0a2888), which publish fine.

_2026-11-08T07:03:00Z_ — Claimed by agy (92bff8c9-777d-458a-a380-8dd5bf5cc0f3) with bean-claim-check: inactive > 3h, completing verification/close-out in Round 4 drain.
