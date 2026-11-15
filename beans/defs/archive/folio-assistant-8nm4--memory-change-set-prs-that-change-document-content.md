---
# folio-assistant-8nm4
$schema: bean/1.0.0
title: 'Memory: Change-set PRs that change document content (e.g. dth-hrh CS-001) are committee decisions; never merge them, and keep their issue open'
status: completed
type: task
priority: low
created_at: 2026-11-01T18:52:30Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `committee-content-no-merge.md` (memory type: feedback) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Change-set PRs that change document content (e.g. dth-hrh CS-001) are committee decisions; never merge them, and keep their issue open


A change set that changes a DTH's content (wording, terms, definitions) is a committee content change. It must not be merged by the agent, and its issue stays open until the committee decides. dth-hrh#61 (CS-001, core data elements) was merged 2026-10-31 and #53 closed; the owner said on 2026-11-01 at 18:50Z, "that should still be open" and "unmerge... it shuold not have been. that is a commitee content change". #53 was reopened, and revert PR dth-hrh#74 was opened, and merged 2026-11-01 20:23Z (5b2d12c) with check:corpus-gate red on the owner's card Q-REV74-1 A. Every block-changing PR trips corpus-gate (no editing-hci-validation instance); a separate thread is fixing it.

**Why:** content belongs to the Authoring Committee, not to the agent or an Editor's Ready for merge alone.
**How to apply:** for a content change set, stop at the PR plus preview, and do not close its issue on merge. Related: folio-assistant-2hay, folio-assistant-94i3.
