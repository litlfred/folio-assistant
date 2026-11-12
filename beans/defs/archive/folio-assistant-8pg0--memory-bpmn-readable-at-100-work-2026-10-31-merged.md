---
# folio-assistant-8pg0
$schema: bean/1.0.0
title: 'Memory: BPMN readable-at-100% work (2026-10-31): merged PRs, open detangle/split PRs, and tool gotchas'
status: completed
type: task
priority: low
created_at: 2026-11-12T09:45:00Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `bpmn-readable-2026-10-31.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: BPMN readable-at-100% work (2026-10-31): merged PRs, open detangle/split PRs, and tool gotchas


Thread "Make BPMN diagrams readable without zooming" (cmsg_017WNUkNK8kdDziPK58Pv6G9QRDNsCWRr1HHGTRfawNkum), issue cat-harness-tools#1116.
- Merged 2026-10-31: bootstrap-tools#53,#54,#56,#57; cat-harness-tools#1117,#1118,#1124,#1125; cat-harness#851,#852,#854,#855; core#396 (21:10Z, Q-BPMN1 A).
- Open drafts (21:40Z): core#447 (public-comment split into public-comment.bpmn + public-comment-change.bpmn / Process_PublicCommentChange; edit+incorporate transitions point at the new file), cat-harness-tools#1190 (detangle never draws a flow through a box; new check edge-through-shape), core#449 and cat-harness#876 (full detangle, user card B).
- Committed BPMN SVGs in cat-harness docs/ and .checklist.md files go stale until re-render/re-pin; checklists need the full index (code lists from higher layers).
- Pending: wire diagram-fit criteria into QA reports after cat-harness-tools#1098.
- Local run: `bun install` in cat-harness-tools, then `CHROMIUM_PATH=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell bun scripts/bpmn-detangle.ts <dirs> [--write|--check]`.
Related: folio-assistant-wmmg, folio-assistant-2hay.
