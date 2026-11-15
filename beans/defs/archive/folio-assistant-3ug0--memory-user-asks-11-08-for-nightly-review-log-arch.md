---
# folio-assistant-3ug0
$schema: bean/1.0.0
title: 'Memory: User asks (11-08) for nightly review-log archive into each log''s own repo + one offline import process (incl. PDF line-numbered feedback template)'
status: completed
type: task
priority: low
created_at: 2026-11-08T08:39:26Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `review-log-archive-import.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: User asks (11-08) for nightly review-log archive into each log's own repo + one offline import process (incl. PDF line-numbered feedback template)

User 2026-11-08 08:34-08:38Z (DPI-H watcher thread …VZ4HJjDbGFC5aMakt3gA63):
- Log watcher archives every log nightly into the log's OWN repo (DPI-H -> smart-ra, DTH-* -> dth-*). Format must beat CSV and allow re-import.
- One general import process for offline work: validate the sheet against the template, review the feedback columns, user picks the rows to import into the master. Imported CS#/PC# are NOT authoritative; check for duplicates; a matching title + # means an addition to an existing comment; watch for conflicts.
- The authoring/public-comment form that goes with the line-numbered PDF should be the feedback template; the import handles it too.
- Plan doc: https://claude.ai/artifact/TNnY1RBEGyvgKLorKiRV1d. Q-ARC-1 ANSWERED 08:46Z: archive is part of the working doc KG beside its issue logs -> new nodes review/public-comment/logs/<log-id>.json (Review log); user 08:48Z: NO list of snapshots -> one logs/<log-id>.xlsx beside the node, overwritten nightly when changed, git history = history, commit msg lists changed cells, Q-ARC-2 ANSWERED 08:42Z: NO custom JSON; user wants a file people open in Excel/Sheets/Numbers -> .xlsx per night + changes.md, Q-ARC-3 A (user 09:27Z '1A..5A' via coordinator).
Related: folio-assistant-94i3, folio-assistant-jxsu, folio-assistant-zufk.
- BUILT 09:38Z: core draft PR #685 (branch claude/review-log-archive, worktree /home/claude/fac-arc, head 6d8f757c), issues #682/#683. Tools: review-log-archive.ts (+xlsx-write.py), review-log-import.ts (check/plan). Read the log per tab (whole-sheet read too large). HOLD released 10:02Z. First DPI-H copy: smart-ra draft PR #236 (worktree /home/claude/sra-arc, branch claude/review-log-archive; merge after core#685). Nightly step (3) is in the watcher trigger: /home/claude/watch/nightly-archive.sh F1 F2 F3, once per UTC day after 02:00Z, commits only on change.
- Card Q-ARC-4 cmsg_017WNUkNK8kdDziPK58Pv6G9F5mZmGd54rJbL2hvYT64ja (10:21Z): A ready+merge #685 then smart-ra#236 / B ready only / C keep drafts. #685 green on draft tier 6d8f757c. Ready-for-review via API refused by the safety check without the user's word.
- Q-ARC-4 = A (user tap 10:54Z). Both PRs marked ready 10:55Z; merge #685 when full checks green, then #236 (update branch first if needed).
- 11:15Z smart-ra#236 red only on kind-validators: 'unmapped family review-log/1.0.0' — needs core#685 merged AND a core re-pin in smart-ra index.lock.json (re-pin card cmsg_…92274f6NQ6yLr68j3J1i4Tt is pending; don't re-pin without the user's word).
- 11:25Z core#685 head 9d17eff4 (usage-path fix). Remaining red: cat-harness-tools standalone-fixture byte-equal (fixture copies core typologies/public-comments.json). Card Q-ARC-5 cmsg_017WNUkNK8kdDziPK58Pv6G9VvNBt5gAHQwNaUofidwcrs: A companion tools PR + merge together / B re-pin train / C hold.
