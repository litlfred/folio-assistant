---
# folio-assistant-hp54
title: 'FOLIO_INIT STATE SOURCE: folio_init resolves each state graph''s declared source — branch-mounted beans/todos by default, declared either way; audit present-but-undeclared state dirs'
status: completed
type: task
priority: normal
created_at: 2026-10-06T17:07:20Z
updated_at: 2026-10-06T19:11:46Z
parent: folio-assistant-fs43
---

Measured 2026-10-06: litlfred/smart-ra got beans/ and todos/ as plain in-checkout dirs on main from its install commit 79fcb9d, written by init-folio.ts, which never consults a declared subgraph source; the folio's instance json declares neither, and the directory checks compare declarations to disk, not the reverse. Owner chose 'fix the process'.

## Done when
- folio_init resolves each state graph's source through resolveSubgraphSource/declaredSubgraph; branch => not written, declared with its branch; directory => written AND declared.
- beans and todos carry a branch-source default a new folio inherits; branch convention documented in directory-conventions.md.
- an audit finding reports a present-but-undeclared top-level state directory (report only).
- tests for both init paths and the finding; PR green.
- folio-assistant's own beans/todos are NOT flipped (that is P4/P6).


## Summary of Changes

Shipped in #2299 (merged ee6773d):

- `instanceStateBranch()` in `schemas/subgraph-source.ts` — the convention `cat/<instance>/<id>`.
- `newInstanceSource: { kind: "branch", keyedBy: "tip" }` on the `beans` and `todos` graph typologies, read once by folio_init (the resolver never reads it).
- folio_init resolves each state graph through the one resolver: a `branch` source is declared, gitignored (`/<path>/**`) and NOT written, with a printed seed command; a `directory` source is written AND declared.
- `undeclared-state` finding in `check:declared-dirs` (report only).
- `state:seed` resolves the repository from the cwd's git toplevel (or `--repo-root`), and `--cutover [--commit]` (`cutoverMain`) is the cutover's main half: refuses unless authoritative, tip-keyed, declared, clean and byte-identical; one commit; never pushes.
- Fresh-repo end-to-end validation passed; smart-ra was cut over with it on 2026-10-06.

Continuation: the cutover now deposits what it removes into fsh-guts first — tracked separately (fsh-guts cutover deposit bean).
