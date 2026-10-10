---
# folio-assistant-xqdi
$schema: bean/1.0.0
title: 'MERGE GATE (b): content-type compile gates - Lean builds, SUSHI/IG AST compiles, JSON-LD + schema validate; site renders advisory'
status: completed
type: task
priority: normal
created_at: 2026-10-02T16:29:16Z
updated_at: 2026-10-09T18:49:00Z
parent: folio-assistant-nok9
---

Child (b) of the merge-gate epic. Design: `cat-harness/docs/proposals/merge-gate-2026-10-02.md` §5.4.

Content-type compile gates, scoped by changed path and **blocking**:
- `.lean` touched → `lake build` of the affected targets (warm cache via `lean-cache-restore`), plus no new `sorry` and no axiom beyond the declared list;
- FHIR IG (`input/fsh/**`, `sushi-config.yaml`, IG AST) → SUSHI reports 0 errors and the IG AST extracts; the full IG Publisher run is advisory;
- any KG node, JSON-LD or schema touched → JSON-LD expands and compacts against the context, every node validates against its zod/JSON Schema, and `kg:audit:check` passes.

Downstream renders (just-the-docs, the Pages site, PDF) are **advisory**, by owner instruction.

## Done when
- [x] a path → gate map is declared as data (not a list in prose), and `gates.ts` reads it
- [x] each gate has a test that fails it on purpose
- [x] an `unknown` (toolchain absent, or cache cold and timed out) blocks; it is never reported as green
- [x] each gate runs on the merge-train result, not only on each PR head

## Closed 2026-10-09

Implemented in `cat-harness` on branch `claude/xqdi-content-compile-gates`, commit `5154349b`:

- **Data map declaration:** `scripts/content-compile-gates.ts` exports `CONTENT_COMPILE_GATES` declaring `G5` (Lean module compile & audit, blocking), `G6` (FHIR IG compile & AST extract, blocking), `G7` (KG JSON-LD expand/compact & schema validation, blocking), `A1` (Downstream site/doc renders, advisory), `A2` (Full IG Publisher run, advisory), and `A3` (Strict KG audit, advisory).
- **`gates.ts` integration:** `scripts/gates.ts` imports and re-exports `CONTENT_COMPILE_GATES`, `contentCompileGates`, and `evaluateCompileGates`, providing `--compile-gates-list` and `--compile-gates <paths...>` CLI support.
- **Third state (`unknown`) enforcement:** Toolchain absence (`lake`/`lean` or `sushi`/AST unavailable) or cache cold timeout produces status `"unknown"`. For blocking gates (G5, G6, G7), `unknown` sets `blocked: true` and `overallPassed: false`; it is never reported as pass/green. For advisory gates (A1, A2), `unknown` warns and does not block merge (`blocked: false`).
- **Merge-train composition:** `unionOfChangedPaths` aggregates changed paths across all PRs in a train; `compileGatesForMergeTrain` and `evaluateCompileGatesForMergeTrain` evaluate all triggered gates over the combined merge result.
- **Verification:**
  - `bun test scripts/tests/content-compile-gates.test.ts`: 29 unit tests covering all 4 Done-when criteria, path routing, intentional failure triggers for each gate, third-state blocking, and merge-train path unions (140 assertions, 0 failures).
  - `bun test cat-harness/scripts/tests/gates.test.ts`: 16 passing tests (0 failures).
  - `bun run typecheck`: clean (0 errors).
