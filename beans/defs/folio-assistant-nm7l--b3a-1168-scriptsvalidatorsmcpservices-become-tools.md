---
# folio-assistant-nm7l
title: 'B3a (#1168): scripts/validators/mcpServices become Tools; satisfiedBy and GraphKindDef.skill flipped'
status: completed
type: task
priority: normal
created_at: 2026-09-23T23:20:35Z
updated_at: 2026-09-23T23:56:10Z
parent: folio-assistant-tr05
---

Part of s4sp (plan B3, split: B3a arrows, B3b skill I/O contracts). Skill scripts/validators/mcpServices removed (26 skills, no live reader); the 6 real scripts become Tools (content-graph-analysis, pages-index, proof-dependency-graph, proof-objects-extract, proof-status-update, paper-latex-build) and content-manifest-validate also satisfies content-validation. Requirement statements lose satisfiedBy; 11 skills declare satisfies: req:<id>#<key> in front matter, 3 capabilities in JSON. GraphKindDef.skill removed; 11 skills declare graph-kinds: in front matter. kg-audit: satisfies-resolves, requirement-statement-satisfied, skill-graph-kinds-resolve.
