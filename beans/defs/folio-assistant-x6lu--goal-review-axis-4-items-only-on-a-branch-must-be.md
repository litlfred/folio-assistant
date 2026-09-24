---
# folio-assistant-x6lu
title: 'goal-review axis 4: ''items only on a branch'' must be compared by bean ID — a stale merge base reported 131 where 1 was real'
status: todo
type: task
priority: normal
created_at: 2026-09-24T12:20:12Z
updated_at: 2026-09-24T12:20:12Z
parent: folio-assistant-ahvw
---

Found 2026-09-24 in a 1-day goal review. The rule concerned is `goal-review` §"The six axes", axis 4, "Items that exist only on a branch … Sweep the open branches' stores too".

**Measured:** `git diff --diff-filter=A origin/main...origin/claude/peaceful-heisenberg-dzgsf1 -- beans/defs` listed **131** added bean files. The branch is 822 commits behind main (merge base 09-22). Compared by bean id against main's store, **1** (`nsbk`) was absent from main. The other 130 exist on main, some since moved or archived. Across all 19 unmerged in-window branches, the by-id count is 20 unique beans; the file-diff count is 152.

This is the skill's own rule 4 ("a window boundary is an artefact") one level down, and it is not stated for this axis. A reader following the axis as written reports a 131-bean hidden epic that does not exist.

## Done when
- [ ] axis 4 says to compare by bean id against the default branch's store, never by file diff against a merge base
- [ ] it gives the check (ids on the branch minus ids on main) and says a large file-diff count from a far-behind branch is the stale-base signature
