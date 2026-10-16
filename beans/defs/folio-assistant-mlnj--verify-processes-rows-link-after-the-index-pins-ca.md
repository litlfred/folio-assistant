---
# folio-assistant-mlnj
$schema: bean/1.0.0
title: 'Verify Processes rows link after the index pins cat-harness-tools#313'
status: completed
type: task
priority: normal
created_at: 2026-10-15T16:53:28Z
updated_at: 2026-10-16T06:40:49Z
parent: folio-assistant-46ob
---

## Parent

folio-assistant-46ob

Processes read "no viewer yet" on 6 harnesses (Bootstrap tools, C@T Harness, FHIR IG Harness, Folio Assistant Core, SMART Base, folio-assistant-sci) because its page is built at publish. Fixed in cat-harness-tools#313 (merged 2026-10-15). Measured locally after the fix: all 7 harnesses link to `/en/cat-harness/processes/`.

## Done when
The folio-assistant index pins tools at or after 874ff41 and the deployed rail shows no Processes row with "no viewer yet".

_2026-10-16_ — Completed: Verified on main (0b4df4ad37): index.lock.json pins cat-harness-tools@23c5fe29c8ef (>= 874ff41) and Processes rows link.
