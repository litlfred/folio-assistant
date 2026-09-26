---
# folio-assistant-kt3q
title: 'Minimum agent-harness + agent-harness-tools: contents, Tools schema strawperson, documentation move-table'
status: completed
type: task
priority: normal
created_at: 2026-09-18T17:15:20Z
updated_at: 2026-09-18T17:19:03Z
---

Issue #223 comments 5732811137 (16:13) and 5732987719 (16:28).

Deliverables:
1. Absolute minimum contents for new repos `agent-harness` and `agent-harness-tools`.
2. Strawperson schema for Tools-repo contents, with a few options and pros/cons for the author to choose from.
3. Thorough analysis of EXISTING documentation, with a table marking each item for its target repo and the reasoning.
4. Suggestions for user todo management (explicitly requested).

The 16:28 comment revises 16:13 substantially:
- agent-harness is **not** self documenting; folio-assist-core is.
- Everything depending on the justthedocs rendering pipeline (webpage etc) -> core.
- Tools illustrating BPMN/DMN -> folio-assist-core-tools; the SKILLS on how they
  are agent guardrails stay in agent-harness.
- Todos and beans remain in agent-harness (schemas, workflow state); their
  RENDERINGS are in folio-assist-core-tools.
- Todo schema and Beans schema live in agent-harness.
- agent-harness is allowed exactly ONE tool: beans (bean-management skills plus
  the Tool node describing CLI install; MCP not required).
- Current folio-assistant depends on folio-assist-core and uses core-tools.

Falsifier for the analysis: if agent-harness ends up with more than a handful of
skills and no crisp line against core, then 'not self-documenting' has not
constrained anything and the split is still notional.
