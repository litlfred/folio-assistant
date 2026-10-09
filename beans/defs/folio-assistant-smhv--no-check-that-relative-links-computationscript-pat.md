---
# folio-assistant-smhv
title: No check that relative links, computation.script paths and {{...}} templates resolve against declared directories
status: completed
type: feature
priority: normal
created_at: 2026-10-04T15:52:14Z
updated_at: 2026-10-09T18:18:44Z
parent: folio-assistant-zzmr
---

Recorded from the qou orphaned-content census, 2026-10-04 (ORPH report; session https://claude.ai/code/session_01NdDGeP1SyShmoUssLuRZ91, issue #2106). qou: 12 absent computation.script files behind 12 blocks (including chi closed-form proofs), 30 dangling lean.refs, and macros used in prose but defined only in main.tex. Proposed: a resolution check over block links, computation.script and {{ }} templates, resolving against the instance's declared directories rather than hard-coded paths. Report-only, with an undetermined state.

## Closed 2026-10-09

- Commit: `3438be171ec421ef48d1e857a6334cf85f43f9a7` on branch `claude/smhv-block-template-resolves`
- Changes:
  - `schemas/kg-qa.ts`: Registered `block-reference-resolves` criterion under `applies: ["folio"]`, `scope: "block"`, `severity: "minor"` (report-only non-blocking warning). Added `"folio"` to `KG_SUBJECT_KINDS` and mapped to `"folio"` graph typology. Added `"block"` to `KG_CRITERION_SCOPES`.
  - `scripts/block-reference-resolver.ts`: Implemented block reference resolution checker covering `computation.script` resolution against declared computation directories, relative link resolution, and `{{...}}` macro templates resolution. Implemented third-state handling (undetermined/unknown when directories are undeclared or absent) and vacuity guard (zero blocks examined returns unknown).
  - `scripts/kg-audit.ts`: Integrated `auditFolioBlocks(root)` and registered fallback directory for folio subject kind.
  - `scripts/tests/block-reference-resolves.test.ts`: Added test suite with 17 tests verifying valid/missing computation.script paths, template macro resolution, third-state behavior for absent directories, vacuity guard, and KgQaReport generation.
- Test evidence:
  - `bun test scripts/tests/block-reference-resolves.test.ts` (17 passed, 0 failed, 65 expect calls).
  - `bun run typecheck` passed cleanly with 0 errors.
