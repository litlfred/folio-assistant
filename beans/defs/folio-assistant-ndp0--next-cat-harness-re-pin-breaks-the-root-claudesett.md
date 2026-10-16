---
# folio-assistant-ndp0
$schema: bean/1.0.0
title: 'NEXT CAT-HARNESS RE-PIN BREAKS THE ROOT: .claude/settings.json hooks and package.json''s cat script call cat-harness/scripts/* that 70lx moved to cat-harness-tools/scripts'
status: completed
type: bug
priority: high
created_at: 2026-10-10T16:42:44Z
updated_at: 2026-10-16T06:40:49Z
parent: folio-assistant-ml9h
---

Found by drain lane B, verified by lane A 2026-10-10: litlfred/cat-harness main no longer has scripts/run-script.ts, session-start-coord-sweep.sh, ask-well.sh or decisions-named-not-asked.ts. The pinned a89998b still has them, so nothing is broken today; the first re-pin of cat-harness past 70lx breaks `bun run cat …`, the SessionStart hook, and two prompt hooks, silently for the hooks.

Lane B also reports the e2e-shard job needs `bunx --bun playwright test` (cat-harness-tools#69 made the same change there).

## Done when
- [x] package.json "cat" resolves run-script.ts from wherever the pinned instances hold it (cat-harness-tools/scripts), not a hard-coded cat-harness path
- [x] .claude/settings.json's three hook commands point at the moved scripts
- [x] the e2e-shard job runs playwright under bun
- [x] landed in the SAME PR as the re-pin past 70lx, or before it with a fallback, so no commit on main has a broken hook

## Owner of the fix (2026-10-10)

Covered by folio-assistant#2529 (session_017QXvm7c7RDYFguWzSxhrMb): package.json cat → cat-harness-tools/scripts/run-script.ts, the three hooks → cat-harness-tools/scripts/, cat-harness + cat-harness-tools pinned together. Close when #2529 merges.

## Owner consent (2026-10-12 ~17:12 UTC, lane A session)
Asked: "May the re-pin #2529 merge with its mechanical .claude/ path edits (3 hook commands + 1 generated-by line now pointing at cat-harness-tools/scripts)?" Answer: "Yes, merge with them". This covers only those mechanical path edits. It was relayed to #2529's session.

_2026-10-16_ — Completed: Verified on main (0b4df4ad37, post-#2529/#2586): package.json cat script, .claude/settings.json hooks, and code-quality-gates.yml e2e-shard point to cat-harness-tools.
