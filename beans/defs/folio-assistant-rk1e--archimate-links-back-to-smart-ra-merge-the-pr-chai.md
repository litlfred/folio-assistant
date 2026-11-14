---
# folio-assistant-rk1e
$schema: bean/1.0.0
title: 'ArchiMate links back to smart-ra: merge the PR chain (owner C, OK to merge)'
status: in-progress
type: task
priority: high
created_at: 2026-11-12T09:45:00Z
updated_at: 2026-11-14T16:05:00Z
parent: folio-assistant-v8bg
tags:
    - handover-2026-11-12
---

Owner thread: https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G9RBRzWsBEvv2Z19MPdrGVRt. Owner chose C and said OK to merge. The thread merges in order as CI goes green.

- [x] folio-assistant-core#764 (first)
- [ ] then dth-hrh#121 (blocked on lock/pins), dth-phc#41 (merged), dth-sfp#10 (merged into dth-sfp#8)
- [x] cat-harness-tools#1950 and smart-trust-demo#133 — with the merge manager
- [ ] smart-ra republishes with smart-ra#241 (blocked on lock/layers/pins)

_2026-11-12T09:45:00Z_ — Filed by thread "Record handover in beans" (https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G9E8Y9ccXJsk3qvGEie1X5Pr), session https://claude.ai/code/session_01Qmmkt7NmLVnjA5oNtkbv3f.

_2026-11-14T16:05:00Z_ — dth-hrh#121 was dirty (main re-pinned past core#764 since): merged main into it, taking main's workflows/index.config.json/index.lock.json; PR diff is the overlay change only again (470c365). Waiting on CI, then merge (owner OK 11-12 09:28Z). Thread session https://claude.ai/code/session_01Qmmkt4e1HartdemKADMACb.
