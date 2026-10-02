---
# folio-assistant-eeqw
title: 'content-change-review GW_Merged: ''No (iterate)'' ends at ''Deployment complete'''
status: completed
type: bug
priority: normal
created_at: 2026-09-23T17:04:00Z
updated_at: 2026-09-23T17:13:40Z
parent: folio-assistant-1swy
---

Found while documenting gateways (t3ad, #1127). The lane note says a 'No' 'ends the pipeline quietly instead of looping back into review', so the route is intended, but its label says 'iterate' (no loop exists) and its end event is named 'Deployment complete' although nothing deployed and the preview is kept. Same pass: methodology-from-source GW_Decision 'changes' → A_Render was checked and is correct (A_Render is the authoring step); only its documentation is sharpened.

## Done when
- [x] p8 relabelled 'No'; it ends at its own end event saying the PR was not merged and the preview is kept
- [x] GW_Decision documentation says the loop re-runs render → place → integrate → tools before the owner reviews again
- [x] regenerated; gates green

## Summary of Changes

content-change-review: p8 is now `No` and ends at the new End_NotMerged ("Not merged: preview kept"); End_Pipeline keeps only the deploy path. methodology-from-source: GW_Decision's documentation says what the `changes` loop re-runs. No other routing changed.
