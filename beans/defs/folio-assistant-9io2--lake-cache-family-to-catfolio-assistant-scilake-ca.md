---
# folio-assistant-9io2
title: lake-cache family to cat/folio-assistant-sci/lake-cache/ (declaration, 8 mirrors, folio-repo renames)
status: todo
type: task
priority: normal
created_at: 2026-10-03T00:51:43Z
updated_at: 2026-10-03T07:55:15Z
parent: folio-assistant-fs43
---

The last special branch still declared under the interim `cat-<name>` scheme. Owner, 2026-10-02: special branches are `cat/<harness>/<name>`; and (confirmed 2026-10-02, Parcel B brief) folio-assistant-sci is the lake-cache harness. So the family becomes `cat/folio-assistant-sci/lake-cache/<pkg>-<slug>`.

Split out of 9c7h on 2026-10-03 because it touches 8 CI and script files that run INSIDE folios (the `mirrors` list in cat-harness/scripts/special-branches.json), and the branches themselves live in the folio repos (e.g. litlfred/qou), which need renaming through rename-special-branch.sh as a handoff bean — never by hand.

## Done when
- [x] special-branches.json: name `cat/folio-assistant-sci/lake-cache/`, legacy `["cat-lake-cache/", "lake-cache/"]`; drop `pendingRename`
- [x] every mirror resolves the new prefix first, then both legacy ones (special-branches.test.ts green)
- [ ] the folio repos' lake-cache branches renamed via a handoff bean (owner runs it)


2026-10-03, branch claude/lucid-shannon-o8zop1-lake-cache (stacked on #1945): declaration moved, pendingRename dropped, all 8 mirrors resolve new -> cat-lake-cache -> lake-cache for reads and writes; special-branches.test.ts and lake-cache.test.ts extended to the three-name order. Not a mirror but a hand-written WRITER: folio-assistant-sci/skills/content/folio-paper-adapter/lean-environment-setup/mathlib-cache-fallback.md's SEED recipe hardcodes BR="lake-cache/<package>-$SLUG" (should call lake-cache.sh resolve-branch); left for a follow-up.
