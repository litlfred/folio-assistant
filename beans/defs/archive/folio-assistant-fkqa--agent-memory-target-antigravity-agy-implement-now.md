---
# folio-assistant-fkqa
$schema: bean/1.0.0
title: 'Agent memory target: Antigravity (agy) — implement now'
status: completed
type: task
priority: normal
created_at: 2026-10-06T18:35:25Z
updated_at: 2026-10-07T12:00:21Z
parent: folio-assistant-31ni
---

Owner 2026-10-06: implement the Antigravity target now (other vendors beaned, not implemented). Antigravity reads AGENTS.md / GEMINI.md and workspace rules under .agents/rules/*.md (older .agent/rules), with activation modes (always-on, model-decided, @-mention, glob) and a size cap reported as ~12,000 chars — format UNVERIFIED (vendor docs blocked from the build container; research in 31ni). No per-agent memory: render the LIVE memory nodes (not archived) as one always-on workspace rule, grouped by owning agent, generated into a marked region with a --check gate and a budget that drops lowest-priority nodes and reports them.

## Todo
- [x] generator target in cat-harness/scripts/agent-memory.ts (or sibling) writing .agents/rules/agent-memory.md
- [x] --check gate wired where memory:check runs
- [x] declare .agents/rules in the KG (cat-harness declaration) per the 'every moved/added asset is in the KG' rule
- [x] verify the format against the live Antigravity docs from a networked environment

## Evidence
- Verified vendor format against Antigravity customization docs (`builtin/skills/agy-customizations/docs/rules.md`): rule at `.agents/rules/agent-memory.md` with frontmatter `trigger: always_on` and `24,000` byte per-file limit.
- Implemented `renderAntigravityRule` and `syncAntigravityRule` in `cat-harness/scripts/agent-memory.ts`:
  - Assembles live memory nodes (excluding archived) grouped by owning agent (`## <agent>`) with `### <LABEL> — <summary>` entries.
  - Re-bases relative links (`../skills/` -> `../../cat-harness/skills/`) so they resolve from `.agents/rules/`.
  - Enforces `ANTIGRAVITY_RULE_BYTE_BUDGET` (24,000 bytes) dropping lowest-priority nodes (`baseline` first, then `trap`) when over budget, reporting what was dropped.
- Wired into `agent-memory:check` (`bun run agent-memory:check`), exiting non-zero when stale.
- Declared `antigravity-agent-rules` in `cat-harness/cat-harness.json` and `folio-assistant.json` under `assets` with `role: "agent-rules"`.
- Unit tests added to `cat-harness/scripts/tests/agent-memory.test.ts` and `test/agent-memory-repo-root.test.ts`. Verified with `bun run check:declared-assets` (32 assets checked, 0 findings).
