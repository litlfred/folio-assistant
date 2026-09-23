---
# folio-assistant-flbx
title: 'NARRATIVE-ASSERTS-CODE: one review axis for ''does the prose say what the artefact does'', with Lean as a specialisation'
status: in-progress
type: feature
priority: normal
created_at: 2026-09-23T09:55:39Z
updated_at: 2026-09-23T10:38:11Z
parent: folio-assistant-1swy
---

The open item from bean 7pdi (its unchecked 'narrative-asserts-code axis' Done-when). Owner 2026-09-23 chose it as next work (session_01SiFEMuTciyB681XP5WfcbB). CRDM: this bean starts at Phase 1 (needs) — nothing built before the needs statement is confirmed.

## Existing partial answers (measured 2026-09-23)
- proof-narrative-lean-equivalence (agent skill): paper prose vs .lean. Lean only; nrv8 found its sweep never read the narrative.
- check:agents-claims (bean 77ex): AGENTS.md vs code, two claim shapes (location, absence). States its own limit on every run.
- BPMN step documentation vs .github/workflows/*.yml: sourced by hand for 95 steps in PR #1025; nothing re-checks it when the YAML changes.

## Not covered
skill text vs code it describes; docs pages vs code; BPMN documentation vs the workflow it draws.

## Constraint carried from 77ex
A checker that greps English cries wolf and gets switched off. Anchor on resolvable things (symbols, paths, if: conditions, exit codes); the rest goes to a reviewer, and disagreement goes to the adjudication process.

## Done when
- [x] Phase 1: needs statement posted on the issue and confirmed by the owner
- [x] Phase 2-4: requirements + impact, options compared, approved
- [x] Phase 5: sign-off (option D, B first), implementation beans cuxx (B), ca4a (A), chhd (C)
