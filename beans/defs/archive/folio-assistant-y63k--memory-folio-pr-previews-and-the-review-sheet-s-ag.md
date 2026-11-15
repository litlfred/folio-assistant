---
# folio-assistant-y63k
$schema: bean/1.0.0
title: 'Memory: Folio PR previews and the review sheet''s Agent tab rules: preview per push, status, dispositions, QA gate, Agent step'
status: completed
type: task
priority: low
created_at: 2026-10-31T17:27:34Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `staging-previews.md` (memory type: feedback) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Folio PR previews and the review sheet's Agent tab rules: preview per push, status, dispositions, QA gate, Agent step

Every PR you open or push to on a folio gets a preview (`bun run cat-harness-tools/scripts/stage-local.ts --repo .`), recorded on the log's Agent - Change Sets tab. No Ready for merge without one.

**Why:** 2026-10-31 the user asked "how can it be ready for merge when there is no preview?" (DPI-H CS-001, smart-ra#185).

**How to apply** (owner rules, 2026-10-31; skill core review-sheet-script.md):
- github.io is blocked here (proxy 403), so check deploys with the deployments API. See folio-assistant-wmmg.
- The script owns the ⏳ status line. RCS "Change Set Feedback (agent)" holds the current proposal and open "Decision needed:" questions only.
- On Ready = Yes, set the comments' Agentic status to "Working" at once, then "PR open" on push.
- Staging deploy (K) goes "building" (push), then "pushed" (gh-pages; also Staging built + built from), then "deploying", then "deployed" or "failed". Each step before deployed carries "expected <YYYY-MM-DD HH:MMZ>": date -u, plus recent pages-build-deployment durations, plus about 8 min of build.
- Disposition is col L, mirrored read-only to RCS "Disposition (agent)". Write it before each preview, and never remove history. Format:
  - "Decided (No. N, date): X, by <who>; <meaning>" lines,
  - a blank line, then an optional "Overall:",
  - then one "No. n: <Accepted|Partially accepted|Not accepted|Noted|Deferred|Duplicate|Out of scope|Withdrawn>. <reason>" line per comment.
  - Start from the Blue Disposition (Review Public Comments col O, row No.+2). Never override a person's word.
  - On merge, use L in the merge commit and as the closing issue comment.
- QA: M "QA gate" is written only by an independent reviewer. The author writes N "QA report" on each push: https://github.com/litlfred/smart-ra/tree/cat/cat-harness/qa-reports/pr/<n>/<full sha>. Never merge unless M passed for the current head.
- Never merge while dispositions are unconfirmed: a committee Disposition of Pending blocks the merge unless RCS Dispositions confirmed = Yes (owner option A, 17:25Z).
- Tools, never typed values: folio-assistant-core tools/review-sheet-sync/agent-record.ts (clone at /home/claude/fac-orange, branch claude/orange-note until merged). It has these commands:
  - `dispositions <json>` writes L (exit 1 means fix the input),
  - `push --head <sha> --expect <min>` is for a new commit,
  - `done` is for a Ready acted on with no commit,
  - `step <name>` sets the Agent step (below).
- Agent step (owner 17:25Z, core 3a5496f): at every move, write "Agent step (change set)" (last column of Agent - Change Sets, added by the script). The names are reading, proposing, editing, pushing, staging, deploying, qa-review, merging, proposed and idle. After a proposal that waits for Ready = Yes, write proposed (core 92635b3). Otherwise write idle when you stop. Never write the ⏳ line; the script restores it.
- Structured cells (15:54Z): "What changed:" and "What the PRs changed" are a label line, then one "• <item> (No. n)" per line. Never join items with semicolons.
- "What the PRs changed" (Agent - Change Sets E) starts with the "What the PRs changed:" line, then the bullets. Never copy the script's rendered status prefix ("smart-ra#N (PR open, …) ·") into it, or the PR shows twice (2026-10-31 20:00Z).
- Watchers check every minute (user, 2026-10-31 20:32Z "watcher every min"). On a new Ready for agent = Yes, write step "reading" at once.
