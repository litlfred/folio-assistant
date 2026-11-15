---
# folio-assistant-eub9
$schema: bean/1.0.0
title: 'Memory: Restoring VaxLink''s live screen toggles in the journeys viewer: device-screen states (tools#1896) + S1–S8 content (smart-trust-demo#123); Q-TMP-1/2 = A'
status: completed
type: task
priority: low
created_at: 2026-11-11T13:08:06Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `tamper-toggle-j3a.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Restoring VaxLink's live screen toggles in the journeys viewer: device-screen states (tools#1896) + S1–S8 content (smart-trust-demo#123); Q-TMP-1/2 = A

2026-11-11, thread cmsg_017WNUkNK8kdDziPK58Pv6G9ARwwSjNDrutftSvkFbdBAj.

- The J3a cue "flip the tamper toggle" was a VaxLink leftover (S4 "Simulate Tampered QR Card", removed in smart-trust-demo#112, commit 1604821b). Q-TMP-1 = A (restore the toggle). Q-TMP-2 = A (all screens).
- Code: cat-harness-tools issue #1893, draft PR #1896 (branch claude/device-screen-states, f832eed3). It adds `states` on device-screen (replace by id, `hide`, a block's `only`), `stateLabel`, a switch above the device, `?state=<id>`, and a Frame on/off button (jp:frame). The kind stays 0.1.0. Code-only.
- Content: smart-trust-demo issue #122, draft PR #123 (branch claude/screen-states). It adds states for S1, S3–S8 (S2 has none), and rewords the J3a cue and the J5 step 3 cue. CI is red until #1896 merges and the re-pin is done, which needs the owner's consent card. The content merge needs a card too. #121 (other thread) also edits workshops/dpi-h-policy-track.workshop.json, so watch for conflicts.
- Screenshots: /mnt/project-files/screen-states-2026-11-11/.
- Still open: the s7/s8 VHL payloads use the real domain portal.moh.gov.la (fictional-countries rule).
Related: folio-assistant-dhls, folio-assistant-omuo.
