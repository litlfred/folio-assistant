---
# folio-assistant-xqdi
title: 'MERGE GATE (b): content-type compile gates - Lean builds, SUSHI/IG AST compiles, JSON-LD + schema validate; site renders advisory'
status: todo
type: task
priority: normal
created_at: 2026-10-02T16:29:16Z
updated_at: 2026-10-03T08:11:59Z
parent: folio-assistant-nok9
---

Child (b) of the merge-gate epic. Design: `cat-harness/docs/proposals/merge-gate-2026-10-02.md` §5.4.

Content-type compile gates, scoped by changed path and **blocking**:
- `.lean` touched → `lake build` of the affected targets (warm cache via `lean-cache-restore`), plus no new `sorry` and no axiom beyond the declared list;
- FHIR IG (`input/fsh/**`, `sushi-config.yaml`, IG AST) → SUSHI reports 0 errors and the IG AST extracts; the full IG Publisher run is advisory;
- any KG node, JSON-LD or schema touched → JSON-LD expands and compacts against the context, every node validates against its zod/JSON Schema, and `kg:audit:check` passes.

Downstream renders (just-the-docs, the Pages site, PDF) are **advisory**, by owner instruction.

## Done when
- [ ] a path → gate map is declared as data (not a list in prose), and `gates.ts` reads it
- [ ] each gate has a test that fails it on purpose
- [ ] an `unknown` (toolchain absent, or cache cold and timed out) blocks; it is never reported as green
- [ ] each gate runs on the merge-train result, not only on each PR head
