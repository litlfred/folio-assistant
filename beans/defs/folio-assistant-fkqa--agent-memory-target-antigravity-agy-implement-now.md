---
# folio-assistant-fkqa
title: 'Agent memory target: Antigravity (agy) — implement now'
status: in-progress
type: task
created_at: 2026-10-06T18:35:25Z
updated_at: 2026-10-06T18:35:25Z
parent: folio-assistant-31ni
---

Owner 2026-10-06: implement the Antigravity target now (other vendors beaned, not implemented). Antigravity reads AGENTS.md / GEMINI.md and workspace rules under .agents/rules/*.md (older .agent/rules), with activation modes (always-on, model-decided, @-mention, glob) and a size cap reported as ~12,000 chars — format UNVERIFIED (vendor docs blocked from the build container; research in 31ni). No per-agent memory: render the LIVE memory nodes (not archived) as one always-on workspace rule, grouped by owning agent, generated into a marked region with a --check gate and a budget that drops lowest-priority nodes and reports them.

## Todo
- [ ] generator target in cat-harness/scripts/agent-memory.ts (or sibling) writing .agents/rules/agent-memory.md
- [ ] --check gate wired where memory:check runs
- [ ] declare .agents/rules in the KG (cat-harness declaration) per the 'every moved/added asset is in the KG' rule
- [ ] verify the format against the live Antigravity docs from a networked environment
