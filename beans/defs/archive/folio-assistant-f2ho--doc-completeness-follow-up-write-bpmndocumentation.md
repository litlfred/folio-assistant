---
# folio-assistant-f2ho
title: 'DOC COMPLETENESS follow-up: write <bpmn:documentation> for the steps activity-documented reports'
status: completed
type: task
priority: normal
created_at: 2026-09-23T07:40:08Z
updated_at: 2026-09-23T09:05:55Z
parent: folio-assistant-1swy
---

Follows bean ooq3 / PR #1008 (issue #1007). Owner 2026-09-23 chose a SEPARATE PR, after #1008 merges.

activity-documented (kg-qa, minor, not gated) reported 95 undocumented steps across the cat-harness diagrams when it landed — read the current count from the sidecars, never from this line.

## Done when
- [x] #1008 merged
- [x] the processes with the most undocumented steps done first (worst at landing: activity-log 8, l2-dak-authoring 7, ig-incremental 7, board-open-close 7)
- [x] each step's documentation says what it asks of its performer, not a restatement of its name
- [x] SVGs, process pages and kg-qa sidecars regenerated; bun run gates green

## Summary of Changes

PR #1025. activity-documented 95 → 0 across 28 diagrams. Every entry was
taken from a source, not the step's name: the skill it names, or, for the
nine CI-workflow diagrams, the workflow YAML including each step's `if:`
condition. Three claims that went beyond a source were cut or softened
before commit (a trashcan "undo", a revision "not inheriting" a verdict, a
vague retention notice). No step needed to go to the owner as
unrecoverable.
