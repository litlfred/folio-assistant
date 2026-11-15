---
# folio-assistant-ewqa
$schema: bean/1.0.0
title: 'Memory: How to build the Code.gs copy page from main + open review-sheet PRs without merging stale branch refs'
status: completed
type: task
priority: low
created_at: 2026-11-01T22:24:09Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `copy-page-build.md` (memory type: feedback) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: How to build the Code.gs copy page from main + open review-sheet PRs without merging stale branch refs

2026-11-01 22:25Z: the copy page shipped build e72dd4dc that lacked the #517 fixes (hide/strike, no link until live). The scratch worktree /tmp/rlw/cp had stale origin/* refs: plain `git fetch origin <b>` there only writes FETCH_HEAD.

**Why:** the user pasted it and had to paste again; the earlier reply claimed features that were missing.

**How to apply:** in the scratch worktree, run `git fetch origin <b> && git update-ref refs/remotes/origin/<b> FETCH_HEAD` for main, claude/review-feedback-clear (#517) and claude/folio-assistant-menu (#550, merged 316e445). Check each SHA against `gh api .../pulls/N --jq .head.sha`. After the build, grep dist/Code.gs for finishDoneRows, "Preview not live yet" and MENU_NAME before you publish. Then write LATEST_BUILD into each log's Config CFG (HRH/PC/SC B7, PHC B8, DPI-H B6). Good build: 3652cf622c134479 (main 316e445 after #550 + #517 head 3df649e), published 2026-11-02 01:23Z, LATEST_BUILD written to all 5 Configs. Related: folio-assistant-ss6x.
