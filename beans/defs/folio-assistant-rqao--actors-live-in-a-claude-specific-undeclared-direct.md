---
# folio-assistant-rqao
title: 'ACTORS LIVE IN A CLAUDE-SPECIFIC, UNDECLARED DIRECTORY: .claude/skills/actors (and capabilities/, requirements/) → an agent-generic declared graph'
status: todo
type: task
priority: normal
created_at: 2026-09-30T08:19:40Z
updated_at: 2026-09-30T08:19:40Z
parent: folio-assistant-tr05
---

Owner, 2026-09-30: 'why .claude/skills/actors/*.json? need generic'.

## Commit archaeology
- 05e72abe92 (2026-03-24, 'Add agent skills framework'): 16 actor definitions created in .claude/skills/actors/, beside .claude/skills/capabilities/ (14), requirements/ (5) and local/ — the framework began as a Claude Code skill tree.
- 571d208db8 (2026-09-18): BPMN/DMN moved INTO the declared kg graph and the actor registry rewritten (roles[], not inherits) — but the actors were left where they were.
- Today cat-harness/cat-harness.json declares no directory for them: AGENTS.md's actor table still points at .claude/skills/actors/*.json. So the one graph every swimlane binds to is (a) under a vendor-named dot-directory the dot-prefix guard forbids for declared graphs, and (b) undeclared, so no kind validator or audit-coverage row can claim it.

## Done when
- [ ] actors (and capabilities/requirements, decided each on its own) live in a declared, agent-generic directory with a graph kind
- [ ] every reader (kg-audit, role-graph, raci-chart, check-fallback-roles, docs generators) resolves it from the declaration
- [ ] AGENTS.md and the role-model skill point at the new home
- [ ] .claude/ keeps only what is genuinely Claude-Code-specific
