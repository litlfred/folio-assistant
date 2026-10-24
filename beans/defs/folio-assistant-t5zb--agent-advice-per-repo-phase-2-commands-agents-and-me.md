---
# folio-assistant-t5zb
$schema: bean/1.0.0
title: 'AGENT ADVICE PER REPO (phase 2): skill commands, agents, memory and .mcp.json where a repo has content for them'
status: todo
type: feature
priority: low
created_at: 2026-10-24T13:20:00Z
updated_at: 2026-10-24T13:20:00Z
parent: folio-assistant-7x5n
blocked_by:
  - folio-assistant-e0uk
---

Phase 2 of the owner's option D (card 2026-10-24 13:15Z). After the index (folio-assistant-e0uk), give repos that publish `user_invocable` skills or define agents (today cat-harness 33, folio-assistant-sci 15, folio-assistant-core 2) the rest of the agent surface: `gen-skill-commands.ts` commands, agents + memory, per-vendor agent files (31ni), and an `.mcp.json` where the MCP skill server runs standalone.

## Done when
Each such repo, checked out alone, offers its invocable skills as commands and its agents to every supported host, generated and gated.
