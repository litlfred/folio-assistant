---
# folio-assistant-p0za
title: 'TOOLS COMPOSITION: 8 of 9 tool-list consumers read the harness-only barrel, so no instance outside cat-harness can serve a Tool'
status: in-progress
type: task
priority: normal
created_at: 2026-09-22T22:33:12Z
updated_at: 2026-09-22T23:10:07Z
parent: folio-assistant-zzmr
---

Found 2026-09-22 while wiring jwox's ChangeSet as a Tool (epic q4jm). Measured, not inferred.

**The two barrels.** Of the nine modules that import a tools barrel:
- **eight** read `cat-harness/tools/index.ts`: check-tools, harness-schema-export, kg-audit, kg-export, tool-coverage and three tests. It holds only cat-harness's own tools (plus `mcp.ts` and `sessions.ts`).
- **one** (`check-maintained-artefacts.ts`) reads the repo-level `tools/index.ts`. That file's own header calls itself *"Every instance's Tool nodes, merged — the one import a consumer needs … Adding an instance is one import and one spread here"*. Its body spreads only cat-harness's tools.

**Consequence.** `smart-base/tools/index.ts` declares Tool nodes (dmn-to-questionnaire, bpmn-to-fsh, …) that no check, export or MCP projection sees. `fhir-harness/tools/index.ts` is the same. A Tool declared in `folio-assistant-core` would be unreachable in exactly the same way. "Declared" is not "reachable" (`covered-is-not-reachable`).

**Why this is not a quick repoint.** The partition gate forbids cat-harness importing core, or any instance that depends on it. So repointing eight harness modules at a barrel that imports core makes the harness depend on core, which is the wrong-direction edge. The composition point probably has to be OUTSIDE the harness: a root-level entry the MCP server is started with, or discovery through declared `tools` graphs with a dynamic import. That is the design question. The tools barrel header records why a runtime scan was rejected before: a malformed Tool would then fail on call rather than at tsc.

## Done when
- [x] the owner has chosen the composition mechanism, recorded here with the reasons against the others (ruling below)
- [x] every declared `tools` graph's Tool nodes reach check-tools, kg-audit, tool-coverage and check-maintained-artefacts; kg-export takes the exported instance's own (`toolsOf`). Test: tools-discover.test.ts. **The MCP projection is NOT covered**: `project()` in `src/mcp/project.ts` is called only by its own test, so no Tool node reaches MCP from any instance yet. That is a separate gap, not this one
- [x] `check:partition` stays at zero wrong-direction edges
- [x] jwox's `folio-changeset` Tool is declared (`folio-assistant-core/tools/index.ts`) and discovered

## Owner ruling 2026-09-22: auto-discovery

The owner was asked with three options side by side and chose **2, auto-discovery**. Every directory an instance declares with graph kind `tools` is loaded at runtime (dynamic `import()` of its `index.ts`), and its Tool nodes are merged. No per-instance barrel edit.

**The alternatives, and why they lost:**
1. **A repo-level list as the single entry point.** Keeps compile-time failure, but about eight harness consumers would change how they receive the list.
2. **No tool at all.** Agents run the CLI directly, so there is no MCP tool and no process binding.

**The known cost, and its mitigation.** The tools barrel header records why a runtime scan was rejected before: a malformed Tool fails when called, not at `tsc`. The mitigation is a gate, `check:tools`, which is already in the gate set. It must load EVERY declared `tools` graph through the same discovery and fail on any module that does not load or any Tool that fails `defineTool`'s schema. A broken Tool then fails in CI on push, not in production on call. That is weaker than `tsc` only in timing within the same PR.

**Constraint that still holds.** The dynamic specifier is a variable read from a declaration, so `repo-partition` counts no import edge (see `qa-checker-discovery.ts`, which already uses exactly this pattern for QA checkers). The harness does not come to depend on core.

- [x] discovery reports a declared `tools` graph whose module does not load as a failure, never as "no tools"

## Round 1 (2026-09-22): built

`cat-harness/tools/discover.ts` provides:
- `discoverTools()`, which returns the loaded Tools together with the sources and the failures;
- `tools()`, which returns the whole repository's Tools and **throws on any failure**;
- `toolsOf(instance)`, which returns one instance's Tools, for writing that instance's document.

It loads modules synchronously with Bun's `require` and a variable path, so the consumers' call sites are unchanged and `check:partition` sees no edge. Nine consumers were repointed.

**Three latent defects surfaced the moment the 11 hidden Tools became visible.** None was caused by this change. Each is evidence the Tools were unreachable.
1. **Five `satisfies` edges in smart-base contradicted their skill's contract.** They are dropped, with a comment on each, and every Tool keeps another edge.
2. **smart-base's nine Tools minted io type IRIs against `http://smart.who.int/base/tool-types.schema.json`**, a document nobody publishes. Discovery now mints every instance against the harness's own base, because the tool-type vocabulary is the harness's. A caller that names a base still gets it everywhere.
3. **kg-export would have filled the harness's document with other instances' Tools**, their links pointing into documents never published. That is why `toolsOf` exists.

The audit writes sidecars for the 11, now 12 with folio-changeset: all pass or n/a, with no findings. Tools: 69 → 81.

**Found, not fixed, and not this bean:** `project()` (MCP) has no caller outside its test.
