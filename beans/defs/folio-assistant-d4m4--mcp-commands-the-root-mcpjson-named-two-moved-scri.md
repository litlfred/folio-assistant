---
# folio-assistant-d4m4
title: 'MCP COMMANDS: the root .mcp.json named two moved scripts, and check:command-paths never read it'
status: completed
type: bug
priority: high
created_at: 2026-09-30T08:30:24Z
updated_at: 2026-10-06T19:30:00Z
parent: folio-assistant-ahvw
---

Found 2026-09-30. Issue #1542. The session host reported `sage` and `google-drive` as failing to connect: `ENOENT` on `scripts/sage-mcp.sh` and `scripts/google-drive-mcp.sh`. Both wrappers moved to `cat-harness/scripts/` in the split.

`check:command-paths` reads the `command` fields in `.claude/settings.json`, from bean `b963`'s "nobody types these" reader, but not in `.mcp.json`. So the class that check was written for stayed open in the one file every MCP host reads. This is a sibling of `b963`, which has no recorded holder and was last touched 2026-09-20. It is filed beside `b963` rather than under it only because a bug cannot parent a bug.

## Done when
- [x] `.mcp.json` repointed, and a server starts from the project root. Measured: `google-drive-mcp.sh` prints `ready (stdio)`.
- [x] `check:command-paths` reads `.mcp.json` `command` and `args`, with tests. Falsified against the real file before the repoint: 2 dead paths reported.
- [x] `cat-harness/docs/sage-mcp.md` names the real path.

## Summary of Changes

Closed 2026-10-06 by claude/sep-bookkeeping-s1-s3 (7x5n sweep of in-progress beans whose work has landed). Every Done-when box was already ticked by its holder. That was NOT taken as the evidence: the measurement below was re-run on main at 24b221415 (2026-10-06), and no open PR names this bean.

- `bun run check:command-paths` → exit 0 (it reads `.mcp.json` `command`/`args`, as box 2 requires).
- The work merged as #1544 (2026-09-30T10:55:26Z, "Root .mcp.json repointed; check:command-paths now reads .mcp.json").
