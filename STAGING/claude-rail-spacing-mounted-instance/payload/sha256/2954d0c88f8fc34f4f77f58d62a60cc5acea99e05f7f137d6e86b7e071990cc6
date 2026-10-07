---
# folio-assistant-4vg7
title: 'WORK PLAN: two bean files declare the same id folio-assistant-t3n8 — every id-keyed reader sees one and silently loses the other'
status: completed
type: bug
priority: normal
created_at: 2026-10-03T12:05:24Z
updated_at: 2026-10-03T12:34:37Z
parent: folio-assistant-ahvw
---

Found 2026-10-03 by the q8ar SQLite slice builder (its manifest lists t3n8 under duplicateIds). Files: `folio-assistant-t3n8--harness-display-names-every-instance-declares-a-hu.md` (parent yj32) and `folio-assistant-t3n8--the-archive-rung-stages-but-can-never-promote-and.md` (parent ahvw). Any reader keyed by id (beans CLI, claim-bean, the dashboard index, roadmap) resolves one and drops the other, and a commit or issue citing `t3n8` is ambiguous.

## Done when
- [x] one of the two gets a fresh id via the beans CLI (never delete either; the owner of each decides which keeps t3n8 if they are cited — check git log / issues / other beans for `t3n8` references first)
- [x] every reference to the renamed one is updated
- [x] a gate fails on a duplicate bean id (check whether an existing check:* should already catch it, and why it did not)

## Summary of Changes

**Which keeps `t3n8`.** The display-names bean (created 2026-09-21, completed, parent `yj32`) keeps it: it is older and is cited by `archive/28jx`, `archive/zj6c`, `wekz` and `cat-harness/scripts/tests/viewer-undiscovered.test.ts`, plus the `_title_comment` of six instance declarations. The archive-rung bean (created 2026-09-22 in `0e8d5294fcb`, todo, parent `ahvw`) is now **`folio-assistant-ke1w`** — renamed with `git mv` rather than `beans create`, so its history follows the file; nothing else was deleted or recreated. No bean referenced `t3n8` structurally (`parent`, `blocking`, `blocked_by`): re-checked by grep over `beans/`.

**References that meant the archive rung**, updated: `cat-harness/methodologies/madr.md` ("Bean `t3n8` carries the measurement and the per-file hashes") and `cat-harness/docs/proposals/lsi-epic-filing-2026-09-29.md` (its INGEST row). Both now name `ke1w` and say it was `t3n8`. Every other `t3n8` in the tree means the display-names bean and is unchanged.

**The gate.** `check:bean-front-matter` gained a `duplicate-id` defect kind: after the per-file parse it groups every bean in `defs/` and `archive/` by its `# <id>` line, and any id declared by more than one file fails the gate. Unit tests in `cat-harness/scripts/tests/bean-front-matter.test.ts` use a two-file fixture reproducing the `t3n8` shape (both files individually valid), plus a defs/archive collision.

**Why nothing caught it.** Every bean check, this one included, judged each file *alone*, and both `t3n8` files were valid. The id-keyed readers (`check-bean-parents`' `byId`, the dashboard index, `beans` itself) build maps by id, so a collision was settled by overwrite instead of being reported.

**A second collision the gate found:** `yt7j` is one bean in two divergent files, `defs/` (todo, titled) and `archive/` (completed, `title: ""`, a RULED body). Repairing it means choosing which file is the bean, which is its owner's call, so it is listed in `DUPLICATE_ID_BASELINE` (reported as outstanding, does not fail) rather than settled here.
