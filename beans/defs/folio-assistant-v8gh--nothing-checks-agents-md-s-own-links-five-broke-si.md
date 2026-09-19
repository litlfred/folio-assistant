---
# folio-assistant-v8gh
title: 'Nothing checks AGENTS.md''s own links — five broke silently in a directory move'
status: todo
type: task
priority: normal
created_at: 2026-09-19T10:51:22Z
updated_at: 2026-09-19T10:51:35Z
---


_2026-09-19T10:51:35Z_ — Measured 2026-09-19 on branch claude/wonderful-bohr-6kxh7b (bean 1hsf): AGENTS.md carried seven dead links. Five broke when docs/ moved under docs/folio-assistant/ — including docs/guides/agent-onboarding.md, which AGENTS.md's own banner calls the place to start, so a cold agent following the banner hit a 404. Two more (llm-authoring-tool-integration, workflow-orchestration) pointed at proposals deleted in e9754a7b and exported to issues #198 and #200. All seven are fixed in that branch. THE GAP IS THAT NOTHING CHECKED THEM: readme:audit (content/pipeline/readme-links.ts) verifies README.md only, and check:agents-xref verifies SECTION CITATIONS INTO AgENTS.md, not links OUT of it. So a directory move can silently break the one file every agent reads first. Cheapest fix is probably to point the existing readme-links checker at AGENTS.md too — it already does relative-path-against-working-tree, ref-aware and Pages-aware checking, and already reports a third state for what it cannot check. Worth confirming it generalises before assuming it does.
