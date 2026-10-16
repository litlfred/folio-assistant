---
$schema: folio-fsh-guts/v1
title: "Eleven dead bean blocks removed from the bean store on 2026-10-16"
kind: retired-edges
movedOn: 2026-10-16
movedFrom: "cat/cat-harness/beans (blocking: and blocked_by: fields)"
summary: >-
  Eleven blocking edges that each blocked a bean already completed or
  scrapped, removed on the owner's choice; recorded here so the edges stay
  recoverable.
---

# Retired bean blocks, 2026-10-16

Eleven `blocking:` / `blocked_by:` edges were removed from the bean store (`cat/cat-harness/beans`, in folio-assistant and cat-harness) on the owner's choice, in session https://claude.ai/code/session_01NUrhvvMEwU5MmPW4L2w9jP.

Each one blocked a bean that was already completed or scrapped, so it held nothing up. The beans page still reported every one as a "No expiry" block.

| blocker (open) | blocked (closed) | blocked bean's status | declared on |
|---|---|---|---|
| 2gst | 5hox | completed | 5hox `blocked_by` |
| 3hk4 | 5hox | completed | 3hk4 `blocking` |
| 7mwa | 5hox | completed | 5hox `blocked_by` |
| 8wj1 | 5hox | completed | 5hox `blocked_by` |
| oqe3 | 5hox | completed | 5hox `blocked_by` |
| 8lcl | iai8 | completed | iai8 `blocked_by` |
| vj2p | iai8 | completed | iai8 `blocked_by` |
| y9r6 | iai8 | completed | iai8 `blocked_by` |
| vj2p | ho66 | completed | ho66 `blocked_by` |
| m4s1 | tbdg | completed | m4s1 `blocking` |
| w1gy | syzb | scrapped | syzb `blocked_by` |

To restore one, add the blocked id back under the blocker's `blocking:`. Bean ids are `folio-assistant-<id>`.
