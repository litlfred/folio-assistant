---
# folio-assistant-94i3
$schema: bean/1.0.0
title: 'Memory: Which thread watches which review log, and how a watcher stays awake (hourly scheduled task + 1-minute send_later chain)'
status: completed
type: task
priority: low
created_at: 2026-10-31T20:13:04Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `review-log-watchers.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Which thread watches which review log, and how a watcher stays awake (hourly scheduled task + 1-minute send_later chain)

Watchers (2026-10-31):
- 2026-11-01 19:05Z (Q-LOG-3 A): ONE watcher for all 5 logs, thread "Watch the RA & DTH review logs" (…WU5PAN9S9dXroMX9Twpkac), incl. DPI-H/RA master log 1TNr5VP1oiE9N0Wd-XCgmUIdishb_Yl6Rm39mNx-_GQY (RCS tab gid 3, cols O:Q = Ready for agent / Dispositions confirmed / Ready for merge). An old "Watch DPI-H Public Comment Log" session sits OUTSIDE the project; the user must stop it. Until then check Agentic status before writing on DPI-H rows.
- DTH-HRH (136BxUK15IUKEm2u-H6rpUkFac6754aRWTeJFe_UKbdU), DTH-PC, DTH-SC, and DTH-PHC (1ACmiSvHK2kYlqaL0--p2u4Op7g4R1_BzgNFuW7QUs3Y, litlfred/dth-phc, added 2026-11-01 08:08Z; rows 3-4 wait on Decision needed for dth-phc#5 and #6): thread "Watch review logs for agent work" (cmsg_017WNUkNK8kdDziPK58Pv6G9WU5PAN9S9dXroMX9Twpkac). Hourly scheduled task trig_01SSHgReQY54GdReN2JQ95Rb (minute 12) plus a 3-minute send_later chain (user 2026-11-01 10:20Z: "instead of 1-minute lets do 3"; was 1 minute). Each wake runs Tool review-log-watch first (core#476 MERGED 2026-11-01 12:59Z as acd6376, issue #475; issue links become clickable rich-text cells, owner 10:51Z; Q-WATCH1 B, Q-WATCH2 B): issues become Contributor Feedback rows; closed-issue rows hidden + struck through (user 10:18Z). Q-WATCH3 (no-sheet opt-out, A rec) pending. State files: ~/.cache/review-log-watch/<sheet-id>.json. After the user runs updateFromGitHub in the library, poll Watch!F1:I1 + header/Issue column with --sheet-hash.

**Why:** DTH-HRH CS-001 sat 7 hours with Ready for agent = Yes and no agent (2026-10-31). A thread only acts when something wakes it, so "a watcher thread exists" is not enough. Scheduled tasks can't run more often than hourly, so a 1-minute send_later chain fills the gap; each check queues the next; the hourly task re-queues the chain if it breaks.

**How to apply:** On a new Ready for agent = Yes, write the Agent step (reading) at once, before any other work. A new log is not set up until a watcher has both wakes. Skill rule is in core#444 (review-sheet-script "Every log needs a watcher"). See folio-assistant-y63k.

2026-11-01 15:30Z: a refresh can CLEAR Issue links; the script fills the Issue column from the Agent tab by Change-set, so restore via Agent rows plus K cells (core#494 merged).

- 2026-11-01 19:47Z: the owner wants the watch to run EVERY 1 MINUTE (send_later chain), with polling first and long PR work handed to owning threads. Every Feedback (agent) cell gets links (PR, preview, section deep links #sec%3A<label>) and filled Selected Sections. Code.gs fbdde2eb (dbcefb6, pasted 20:06Z) keeps agent-written links on refresh. Q-FBK-2 A: #514 then #517 merge when green; never push to #514 again, put script fixes on #517's branch claude/review-feedback-clear.
- 2026-11-01 20:34Z: corpus-gate fix (cat-harness-tools#1329) records person steps from sheet cells too: when Ready for agent / Ready for merge change on a CS row, hand CS id, cell, time to the owning thread and the corpus-gate thread (…BMMNFQ4yKq4NThjCE8sb8T).
- 2026-11-01 21:05Z: a copy-page republish of MAIN's build (4a63cef7, core#474) dropped the #514 link fix; user pasted it and links vanished. RULE: while #514/#517 are open, the copy page carries main MERGED WITH the open review-sheet PR heads (scratch merge, rebuild dist, run tests, never push). Republished as 08f45cd1 (main + #514 dbcefb6); asked the user to paste. After the paste, restore links in HRH M cells. send_later is one-shot: queue the next poll first.
- 21:20Z STALL RULE (owner 21:08Z): every poll, hand new Blue feedback verbatim to the row's owning thread and say so in M; stalled = feedback/Ready changed >10 min with no Agent step, or no step 2h: ask owner once, else take over. core#565 (issue #564). CS-007 owner thread …98q7ycpNcyZETyhTTp9ETxW (#88 NHWA overlay).
