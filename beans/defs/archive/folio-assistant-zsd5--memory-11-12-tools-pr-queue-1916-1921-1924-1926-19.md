---
# folio-assistant-zsd5
$schema: bean/1.0.0
title: 'Memory: 11-12 tools PR queue (#1916,#1921,#1924,#1926,#1932,#1934-1936) red causes: two flakes fixed by #1937/#1938; how to read "new failures"'
status: completed
type: task
priority: low
created_at: 2026-11-12T08:36:22Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `tools-queue-green-2026-11-12.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: 11-12 tools PR queue (#1916,#1921,#1924,#1926,#1932,#1934-1936) red causes: two flakes fixed by #1937/#1938; how to read "new failures"

Thread "Green the tools PR queue" cmsg_017WNUkNK8kdDziPK58Pv6G94UB5EYmCsnRRgSrAY3jYwq (dispatched by merge manager 08:34Z 11-12).

- Gotcha: grepping the "Tests (no new failures)" log for a test name also hits the "Failing on main too" list. Read only the "New failures (fail this check)" block. library-refscan "carries NOTHING ELSE" fails on main too (ENOENT on gitignored cat-harness docs/assets/library/index.json); it was NOT #1921's cause.
- Real new failures, one per PR, both timeouts: regen-writers render:bpmn:check 120 s (#1921, #1932, #1934; fixed by #1937 merged 08:32Z) and resolution-across-needs 240 s (#1916, #1936; fixed by #1938).
- #1924, #1935 full-tier green 08:40Z. #1926 had no release label.
- Plan: merge #1938 + #1941 (30 s timeout every file), then update-branch each queue PR right before its merge. No code changes in queue PRs.
Related: folio-assistant-h5ud, folio-assistant-pblp, folio-assistant-36f6.
- Q-DTH-LAYER A (09:09Z): tools#1952 (issue #1951) check:foreign-paths ✗ keyed by literal+target, not file (dth-sc#24 moved pages). dth-pc#14 needs NO new gate: tools main covers business-processes since #1733; its branch pins tools 42cc850e (11-05). Needs re-pin + its own processes/ serialisations declaration.
- Local tools tests: clone bootstrap-tools + cat-harness beside tools, bun install, symlink /home/user/node_modules -> tools/node_modules, then `bun test <file>`.
