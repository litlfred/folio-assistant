---
# folio-assistant-t5zb
$schema: bean/1.0.0
title: 'AGENT ADVICE PER REPO (phase 2): skill commands, agents, memory and .mcp.json where a repo has content for them'
status: in-progress
type: feature
priority: low
created_at: 2026-10-24T13:20:00Z
updated_at: 2026-10-30T13:04:00Z
parent: folio-assistant-7x5n
---

Phase 2 of the owner's option D (card 2026-10-24 13:15Z). After the index (folio-assistant-e0uk), give repos that publish `user_invocable` skills or define agents (today cat-harness 33, folio-assistant-sci 15, folio-assistant-core 2) the rest of the agent surface: `gen-skill-commands.ts` commands, agents + memory, per-vendor agent files (31ni), and an `.mcp.json` where the MCP skill server runs standalone.

## Done when
Each such repo, checked out alone, offers its invocable skills as commands and its agents to every supported host, generated and gated.

_2026-10-30T11:10:00Z_ — Block lifted: `folio-assistant-e0uk` is `completed` (all eight layer PRs merged on 2026-10-29).

_2026-10-30T13:04:00Z_ — Opened all four PRs implementing Phase 2 per-repository agent surface and gates:
- `litlfred/cat-harness-tools` PR [#876](https://github.com/litlfred/cat-harness-tools/pull/876) (`cat/bean/t5zb-agent-surface-phase2`): per-instance skill package & memory discovery (`packagesFor`, `memoryDirsFor`, `vendorTargetsFor`, `--dir <root>`), `checkoutRootFor` root resolution for standalone checkouts, `cat-harness` relative link rebasing, sibling-clone `needs` concern-group inheritance in `concern-groups.ts`, and adding `skill:commands:check` + `agent-memory:check` to `CHECKOUT_SCRIPTS` in `run-gates.py`.
- `litlfred/cat-harness` PR [#724](https://github.com/litlfred/cat-harness/pull/724) (`cat/bean/t5zb-agent-surface-phase2`): 31 generated `.claude/commands/*.md` slash commands, `.claude/agents/{ci-health-watcher,platform-boundary-guard}.md`, `.claude/agent-memory/` (13 + 8 entries and 5 detail sidecars), `.agents/rules/agent-memory.md`, `.agents/skills/*-memory/SKILL.md`, and `.{gemini,codex,cursor,github}/agents/*` vendor definitions.
- `litlfred/folio-assistant-sci` PR [#117](https://github.com/litlfred/folio-assistant-sci/pull/117) (`cat/bean/t5zb-agent-surface-phase2`): 17 generated `.claude/commands/*.md` slash commands.
- `litlfred/folio-assistant-core` PR [#236](https://github.com/litlfred/folio-assistant-core/pull/236) (`cat/bean/t5zb-agent-surface-phase2`): 2 generated `.claude/commands/{review,review-comments}.md` slash commands, `platform-boundary-guard` Claude/Antigravity/vendor agent & memory projections (2 entries from `folio-assistant-core/memory/`), and standalone `.mcp.json`.
