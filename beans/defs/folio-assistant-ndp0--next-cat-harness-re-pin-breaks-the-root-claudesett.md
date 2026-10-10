---
# folio-assistant-ndp0
$schema: bean/1.0.0
title: 'NEXT CAT-HARNESS RE-PIN BREAKS THE ROOT: .claude/settings.json hooks and package.json''s cat script call cat-harness/scripts/* that 70lx moved to cat-harness-tools/scripts'
status: todo
type: bug
priority: high
created_at: 2026-10-10T16:42:44Z
updated_at: 2026-10-10T16:58:41Z
parent: folio-assistant-ml9h
---

Found by drain lane B, verified by lane A 2026-10-10: litlfred/cat-harness main no longer has scripts/run-script.ts, session-start-coord-sweep.sh, ask-well.sh or decisions-named-not-asked.ts. The pinned a89998b still has them, so nothing is broken today; the first re-pin of cat-harness past 70lx breaks `bun run cat …`, the SessionStart hook, and two prompt hooks, silently for the hooks.

Lane B also reports the e2e-shard job needs `bunx --bun playwright test` (cat-harness-tools#69 made the same change there).

## Done when
- [ ] package.json "cat" resolves run-script.ts from wherever the pinned instances hold it (cat-harness-tools/scripts), not a hard-coded cat-harness path
- [ ] .claude/settings.json's three hook commands point at the moved scripts
- [ ] the e2e-shard job runs playwright under bun
- [ ] landed in the SAME PR as the re-pin past 70lx, or before it with a fallback, so no commit on main has a broken hook

## Owner of the fix (2026-10-10)

Covered by folio-assistant#2529 (session_017QXvm7c7RDYFguWzSxhrMb): package.json cat → cat-harness-tools/scripts/run-script.ts, the three hooks → cat-harness-tools/scripts/, cat-harness + cat-harness-tools pinned together. Close when #2529 merges.
