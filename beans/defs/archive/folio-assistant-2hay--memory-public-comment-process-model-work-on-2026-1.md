---
# folio-assistant-2hay
$schema: bean/1.0.0
title: 'Memory: Public comment process model work on 2026-10-31: merged PRs, the release-cycle process, sibling threads and the preview repin PR'
status: completed
type: task
priority: low
created_at: 2026-10-31T13:53:47Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `public-comment-process-2026-10-31.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Public comment process model work on 2026-10-31: merged PRs, the release-cycle process, sibling threads and the preview repin PR


Thread "Improve the public comment process page" (cmsg_017WNUkNK8kdDziPK58Pv6G9TZ7pyERmUU6G9E7cZ89j3u).
- Merged 2026-10-31 under the 13:23Z window: tools#1100 (call-activity click-through, event subprocesses in the process model), tools#1133 (staging first visit hidden until share worker reloads; the "large letter flash" came from staging-share, not cat-harness#820), tools#1137 (linkProse: process ids and skill names in BPMN documentation become links; processes:viz warns on unlinkable).
- core#400 (withdrawal as an interrupting event subprocess), #410 (intake lane below coordinator, ends on the right edge), #415 (withdrawal message end tells coordinator and committee, owner card A), #419 (Process_PublicCommentRelease, called from Process_Publication).
- fa#2847 (preview PR, not merged) pins core d5f3dba (incl. core#423 channels, core#430 pc:pdf/pc:release in release tasks); preview live 16:12Z. fa CI red is main-red, commented. Other threads also push repins onto this branch.
- fa lock repin by hand: treeDigest = digestOf() from cat-harness-tools scripts/mount-from-lock.ts run on a `git archive` export of the instance at the new sha; also update files count and declaration sha256.
- Sibling threads: "Publish a fixed public comment release" (PC/<version>/ on gh-pages, release.json; owns Task_BuildPcRelease, Task_ArchiveRelease) and "Set up public comment channels and intake" (new skill public-comment-channels to add to Task_SetUpChannels/Task_WriteAnnouncement; owns submitters gap).
- BPMN start/end guidance (Silver Method and Style) isn't in the bpmn skills yet; only offered.
- Local toolchain trick: /tmp/idx2 index workspace (bootstrap-tools 431b4bc clone + worktrees) and /home/claude/node_modules symlink lets `bun run cat bpmn:checklist` and tests run.
Related: folio-assistant-wmmg, folio-assistant-8pg0.

- Code.gs copy page (artifact, copy button): https://claude.ai/artifact/MXNQcLMzLYqq5us5x6phGd, slug a6344763-c854-431a-be38-12e6f159b732. Republish it whenever dist/Code.gs changes (generator: write HTML with escaped code + Copy button; publish_files needs the file under the repo checkout, not /tmp or /mnt).
- fa#2847 (withdrawal subprocess, PR-release steps, angle-bracket escape in process pages via tools#1162) merged 19:16Z 2026-10-31 at merge d0c9151. Open: the user's "left edge cut off" on process pages is unconfirmed; ask for a screenshot if raised again.
- Any change to a core diagram (e.g. public-comment.bpmn, contributor-feedback.bpmn) must re-extract its .pot translation files in the same PR; fa registered gate flags stale ones (core#442 fixed these two).

## Feedback (agent) cell format (owner 2026-11-01 19:27Z, standing)
- The ask comes first, in one plain sentence: "Decision needed: <question>?" with lettered options A/B/C on their own lines (one recommended), or "Please review: <what exactly to check>". Then a blank line.
- Then "Status:" (one line: PR, state) and "Next:" (who does what). No history replay.
- Only the tags are bold (rich text on the tag only); the cell format is not bold. Code: core#514 decisionSpans.
- Agentic status "Needs you" ONLY when a real Decision needed block exists. Committee drafts use "Committee review: <PR>". Splits use "Split into …", and reverts use "Revert open: <PR>".
- Keep rows current: check PR and issue state before you write.
- Standing rule (owner 2026-11-01 19:35Z): the agent writes Feedback (agent) WHENEVER a Blue (people) cell changes or a new row appears, in all 5 logs. Watcher: /tmp/rlw/blue.py hashes each row's Blue cells. Layout skill: core#517 (Q-FBK-1 A), with lint.ts for each poll.
