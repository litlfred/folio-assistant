---
# folio-assistant-flbx
title: 'NARRATIVE-ASSERTS-CODE: one review axis for ''does the prose say what the artefact does'', with Lean as a specialisation'
status: completed
type: feature
priority: normal
created_at: 2026-09-23T09:55:39Z
updated_at: 2026-09-23T13:31:33Z
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

## Summary of Changes

Issue #1042, all three signed-off stages built:
- B — cuxx, PR #1065: prose-reviewed-since-code-changed over 32 declared
  pairs, attestations in the kg-qa sidecar, `pairs:attest`.
- A — ca4a, PR #1072: prose-claims-resolve (holds / false / undetermined),
  `pairs:claims`; fixed test-engineer.md's stale test-types.ts path.
- C — chhd, PR #1086: the review branch, narrative-code-review.bpmn, the
  narrative-asserts-code skill, and the exclusive-gateway wording fix.
Requirements page: docs/proposals/narrative-asserts-code.md. Closing the
issue is the owner's call.
