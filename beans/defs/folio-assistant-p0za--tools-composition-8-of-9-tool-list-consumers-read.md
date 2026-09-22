---
# folio-assistant-p0za
title: 'TOOLS COMPOSITION: 8 of 9 tool-list consumers read the harness-only barrel, so no instance outside cat-harness can serve a Tool'
status: todo
type: task
created_at: 2026-09-22T22:33:12Z
updated_at: 2026-09-22T22:33:12Z
parent: folio-assistant-zzmr
---

Found 2026-09-22 while wiring jwox's ChangeSet as a Tool (epic q4jm). Measured, not inferred.

**The two barrels.** Of the nine modules that import a tools barrel:
- **eight** read `cat-harness/tools/index.ts`: check-tools, harness-schema-export, kg-audit, kg-export, tool-coverage and three tests. It holds only cat-harness's own tools (plus `mcp.ts` and `sessions.ts`).
- **one** (`check-maintained-artefacts.ts`) reads the repo-level `tools/index.ts`. That file's own header calls itself *"Every instance's Tool nodes, merged — the one import a consumer needs … Adding an instance is one import and one spread here"*. Its body spreads only cat-harness's tools.

**Consequence.** `smart-base/tools/index.ts` declares Tool nodes (dmn-to-questionnaire, bpmn-to-fsh, …) that no check, export or MCP projection sees. `fhir-harness/tools/index.ts` is the same. A Tool declared in `folio-assistant-core` would be unreachable in exactly the same way. "Declared" is not "reachable" (`covered-is-not-reachable`).

**Why this is not a quick repoint.** The partition gate forbids cat-harness importing core, or any instance that depends on it. So repointing eight harness modules at a barrel that imports core makes the harness depend on core, which is the wrong-direction edge. The composition point probably has to be OUTSIDE the harness: a root-level entry the MCP server is started with, or discovery through declared `tools` graphs with a dynamic import. That is the design question. The tools barrel header records why a runtime scan was rejected before: a malformed Tool would then fail on call rather than at tsc.

## Done when
- [ ] the owner has chosen the composition mechanism, recorded here with the reasons against the others
- [ ] every declared `tools` graph's Tool nodes reach check-tools, kg-export and the MCP projection (test: a Tool declared in a non-harness instance is listed)
- [ ] `check:partition` stays at zero wrong-direction edges
- [ ] jwox's `folio_changeset` Tool is declared and served
