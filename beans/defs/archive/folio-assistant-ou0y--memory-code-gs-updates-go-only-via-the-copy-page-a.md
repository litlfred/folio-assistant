---
# folio-assistant-ou0y
$schema: bean/1.0.0
title: 'Memory: Code.gs updates go ONLY via the copy page artifact; updateFromGitHub is broken (user 2026-11-01 16:05Z)'
status: completed
type: task
priority: low
created_at: 2026-11-01T16:09:49Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `codegs-copy-page.md` (memory type: feedback) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Code.gs updates go ONLY via the copy page artifact; updateFromGitHub is broken (user 2026-11-01 16:05Z)


Whenever the review sheet Code.gs changes, republish the copy page artifact
(slug a6344763-c854-431a-be38-12e6f159b732, https://claude.ai/artifact/MXNQcLMzLYqq5us5x6phGd)
from tools/review-sheet-sync/dist/Code.gs and give the user that link with 3 steps:
library Extensions > Apps Script, paste over Code.gs and save, then Folio Assistant > Refresh now in each log (menu renamed 2026-11-02, core#550).
Never tell the user to run updateFromGitHub.

**Why:** user said "updater gitiuhb script is BROKEN. when i need to update code.gs just show me copy code page".
**How to apply:** publish_files needs the page under /home/claude (not /tmp). Related: folio-assistant-94i3.
