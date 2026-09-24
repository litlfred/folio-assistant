---
# folio-assistant-269z
title: Folio handle covers the who-iris replica's INGESTED COPY banner — conflicts with jpjt 'replica unchanged'
status: completed
type: task
created_at: 2026-09-24T18:04:45Z
updated_at: 2026-09-24T18:04:45Z
parent: folio-assistant-4ccr
---

Found by bean 015u (2026-09-24). On the who-iris replica the fixed ▾ Folio handle covers the 'INGESTED COPY — not WHO' banner at 390 px, and at 1280 px a link sits centred under it, so a click there opens the glass instead.

The obvious fix, reserving the handle's band with top padding, is ruled out by an existing rule: `folio-mount.e2e` asserts a replica is UNCHANGED while the glass is closed (bean jpjt: who-iris exists to look like WHO). 015u tried it, and CI refused it.

It is the owner's decision. Options:
1. Accept the overlap on replicas (jpjt wins).
2. Let replicas reserve the band, and amend jpjt's rule to allow that one change.
3. Move or shrink the handle on replica pages only (e.g. a corner tab), leaving the page itself untouched.

## Done when
- [x] The owner has chosen: **bottom-right tab** (2026-09-24)
- [x] The chosen option is implemented

## Summary of Changes — 2026-09-24

**The first ruling rested on a wrong claim, and the measurement caught it.**
The owner first chose "corner tab", which I had recommended as "clear of the
banner". Measured before writing it, a TOP-right tab still covered banner
text at 1280 and 390 px, because the replica's banner runs the full width. I
went back to the owner with the measurements, and the owner chose
**bottom-right**.

**Measured** on the who-iris replica, by the text and controls under the handle:

| placement | 1280 px | 390 px |
|---|---|---|
| centred top (before) | banner text, and the `folio-assistant` link centred under it | the INGESTED COPY banner |
| top-right tab | banner text | banner text |
| **bottom-right tab (chosen)** | **clear** | floats over whichever body line scrolls past, like any floating button |
| inside the left rail | the rail's own home item | the rail's own home item |

**Fix:** `docs-ui.css` makes the handle a bottom-right tab on pages carrying the
folio mount (`<script data-fa-folio-mount>`). Harness viewers are excluded by
their own mark: the library viewer carries the mount too, and a bottom-right
tab there landed on a row's "Pull out to folio" button at 390 px. Only the
handle moves, so `jpjt`'s "replica unchanged" still holds, and
`folio-mount.e2e` passes.

**Tests:** `glass.e2e.ts` checks that on a mount-marked fixture the handle's
corner is the viewport's corner, the body has no band, and the `h1` is above
it, at 1280 and 390 px. Both checks fail with the rule disabled. 97 pass across
the six related e2e files.

