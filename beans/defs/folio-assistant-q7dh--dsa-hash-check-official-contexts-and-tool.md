---
# folio-assistant-q7dh
$schema: bean/1.0.0
title: 'check:dsa-hash: validate against official ODRL/DCAT/DCMI contexts, declare it as a Tool'
status: todo
type: task
priority: normal
created_at: 2026-10-30T20:40:00Z
updated_at: 2026-10-30T20:40:00Z
parent: folio-assistant-negd
---

Follow-up to bean `2z1t` (litlfred/folio-assistant-core#249, merged 2026-10-30 20:30Z). Issue: litlfred/folio-assistant#2702.

## What is left
1. `folio-assistant-core` `check-dsa-hash.ts` checks field names against hand-written lists of ODRL 2.2, DCAT 3 and DCMI Terms. Bean `2z1t` said to validate against the official published JSON-LD contexts, never a hand-written copy. Vendor (pinned, hashed) or load the official contexts and check against them.
2. `kg:audit` reports `activity-skill-has-tool` on the four DSA steps: no Tool declares it satisfies the `dsa-*` skills. Declare a `check-dsa-hash` Tool that does.
3. `kg:audit` reports `skill-voice-review-current` on the four new `dsa-*` skills: run the voice review.

## Done when
- The term check reads only official contexts; a made-up term fails it.
- `kg:audit` shows neither finding for the DSA steps and skills.
- No new schema fields are invented.
