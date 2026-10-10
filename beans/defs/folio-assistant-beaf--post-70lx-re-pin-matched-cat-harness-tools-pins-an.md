---
# folio-assistant-beaf
title: 'Post-70lx re-pin: matched cat-harness + tools pins and root runner paths'
status: todo
type: task
created_at: 2026-10-10T05:48:27Z
updated_at: 2026-10-10T05:48:27Z
---

cat-harness e29c6429 (70lx stage 1a) moved scripts/ and the rest of its code to cat-harness-tools (d8d42ab). The index on #2518 (head 90148ed) still pins the pre-move pair, and its root `cat` names cat-harness/scripts/run-script.ts, so no checkout can run cat-harness main. Related: folio-assistant-txue (S5 code out of cat-harness).

Stacked on #2518 as branch claude/post-70lx-repin (#2518 is driven by another session; do not push to its branch).

Done when:
- the lock pins a matched post-70lx pair, written by mount:remote
- the root manifest, .github/mount-from-lock.sh, workflows and bunfig name cat-harness-tools for the moved code
- a fresh lay-down passes mount:lock --check, a frozen install, cat --list and state:mount
- gates have been run and reported
