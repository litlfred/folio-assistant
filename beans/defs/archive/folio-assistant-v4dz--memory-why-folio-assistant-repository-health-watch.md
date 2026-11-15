---
# folio-assistant-v4dz
$schema: bean/1.0.0
title: 'Memory: Why folio-assistant "Repository health watchdog" goes red on some days (addQa vs reader resolution) and the fix tools#1683'
status: completed
type: task
priority: low
created_at: 2026-11-08T07:29:24Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `fa-health-watchdog-red-2026-11-08.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Why folio-assistant "Repository health watchdog" goes red on some days (addQa vs reader resolution) and the fix tools#1683


Thread "Fix red folio-assistant main" (cmsg_017WNUkNK8kdDziPK58Pv6G9JzvTuQvzBUmgrcF8ErDdjq), 2026-11-08.

- health-check.yml red days 11-02, 11-03, 11-06, 11-08 all = exit 2 (unknown), never the findings. Findings (repo size, orphan previews, credentials "no needs.json") only update the tracking issue; green days have them too. Credentials findings are NOT leaked secrets.
- Cause: sweep at 06:41Z runs before main HEAD's gates publish a qa-reports entry. `addQa` called `findSkippedTarget` without repoRoot (no ancestor walk) -> NO-ENTRY; readers pass repoRoot -> nearest ancestor -> nothing under health -> pages-publish-health unknown.
- Fix cat-harness-tools#1683 (branch claude/qa-add-ancestor-resolve, 781dbcd): pass repoRoot. Reaches fa only after a tools re-pin.
- `gh issue create` was refused by the auto-mode safety check in this thread.
- Tools unit tests need the fa mount (deps on bootstrap-tools): copy files into fa's cat-harness-tools mount and `bun test` there.
- 07:56Z: #1683 green (14 pass, 7 skip). Merge request sent to merge manager. Marking ready / label / ready comment refused by safety check; card Q-HWD-1 (cmsg_017WNUkNK8kdDziPK58Pv6G94HUQiJNqWWzpmsj8cm9HKg) asks owner, rec A.
- 08:25Z owner Q-HWD-1 A; #1683 marked ready, labelled, ready comment posted.
- 08:26Z #1683 MERGED. fa watchdog green needs next tools re-pin (merge manager / re-pin train). Thread resolved.
