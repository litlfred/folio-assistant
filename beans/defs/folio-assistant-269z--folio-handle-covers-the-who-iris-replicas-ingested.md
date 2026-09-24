---
# folio-assistant-269z
title: Folio handle covers the who-iris replica's INGESTED COPY banner — conflicts with jpjt 'replica unchanged'
status: todo
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
- [ ] The owner has chosen
- [ ] The chosen option is implemented, or the overlap is recorded as accepted
