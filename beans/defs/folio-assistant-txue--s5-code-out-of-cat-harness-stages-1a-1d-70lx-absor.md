---
# folio-assistant-txue
$schema: bean/1.0.0
title: 'S5 code out of cat-harness: stages 1a-1d (70lx absorbs w2gr 3b), 8lcl, y9r6, vj2p'
status: in-progress
type: task
priority: normal
tags:
    - mvp
created_at: 2026-10-01T08:14:34Z
updated_at: 2026-10-30T18:45:00Z
parent: folio-assistant-7x5n
blocked_by:
    - folio-assistant-rfuq
---

D1: all cat-harness code -> cat-harness-tools. One agent at a time.

## Done when
- [x] 70lx: server/tools/routes/rbac/auth/mcp moved; MCP server lists the same tools
- [ ] 8lcl Zod moved; JSON Schema stays
- [ ] y9r6 no .ts in cat-harness content
- [ ] vj2p each instance hosts its own outputs

## State 2026-10-09
- 70lx (stage 1a): completed. y9r6 (1c): completed (closed on #1702). 8lcl (1b): todo — 254 Zod modules still in `cat-harness/schemas/`. vj2p (1d): todo — higher-instance outputs still in cat-harness.
- Measured: `find cat-harness -name '*.ts' -o -name '*.js' -o -name '*.py' -o -name '*.sh'` → **1721** code files in the mounted litlfred/cat-harness@bd72c68, so D1 (all cat-harness code → cat-harness-tools) is not met. **Finding, not a reopen:** `y9r6`'s own first box (gate `check:content-code-free`, no tracked .ts/.js/.py/.sh under cat-harness) is not true today; it was closed on #1702 (the skill-definition JSON), which covers one of its four bullets.
Remaining: 8lcl and vj2p, now PRs to litlfred/cat-harness and litlfred/cat-harness-tools. Session https://claude.ai/code/session_017QXvm7c7RDYFguWzSxhrMb.

_2026-10-15T16:49Z_ — Block lifted: `a4of` is completed (PR #2317 merged 2026-10-06). The edge was the work plan's "Block never lifted" finding (owner, 2026-10-15). Session https://claude.ai/code/session_01Pc8vSeXCwp5Ckvmz56cMDs.


_2026-10-15T16:49Z_ — Block lifted: `a4of` is completed (PR #2317 merged 2026-10-06). The edge was the work plan's "Block never lifted" finding (owner, 2026-10-15). Session https://claude.ai/code/session_01Pc8vSeXCwp5Ckvmz56cMDs.

_2026-10-16T06:30:00Z_ — The note above is mirrored from the folio-assistant store (commit 0b8d249), where this edge was lifted on 2026-10-15; lifted here too (Owner ruling 2026-10-16, item 9). Session https://claude.ai/code/session_01Pc8vSeXCwp5Ckvmz56cMDs.

_2026-10-30T18:45:00Z_ — vj2p completed; 8lcl landed apart from its generated-JSON-Schema box; y9r6 box 1 met (0 code files under cat-harness). Session https://claude.ai/code/session_01Qmmkt7dhGQL6nLTZKbWCxo.
