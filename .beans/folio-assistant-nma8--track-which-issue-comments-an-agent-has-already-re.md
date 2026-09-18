---
# folio-assistant-nma8
title: Track which issue comments an agent has already read
status: completed
type: task
priority: normal
created_at: 2026-09-18T16:15:27Z
updated_at: 2026-09-18T16:37:29Z
---

From #203 comment 5732039852 (2026-09-18 15:13).

> "make sure human/agentic coders know to check issue for new/updated
> comments (keep track of what they already viewed) to see if it changes
> current direction or is work to queue. if large chunk of work then assess
> if this is a good stopping point for STAGING review and confirm user
> priorities on sub-issues."

Three parts: (1) re-check the issue periodically, not once at the start;
(2) TRACK what has already been read, which needs durable state — a comment
id high-water mark, plausibly under `.folio/` beside workflow state;
(3) at a large chunk, stop for STAGING review and confirm priorities rather
than continuing.

DEMONSTRATED LIVE: this session missed FIVE owner comments (14:31 → 15:55)
while working, including this one. Found only when the author said "new
comments". Exactly the failure the ask describes.
