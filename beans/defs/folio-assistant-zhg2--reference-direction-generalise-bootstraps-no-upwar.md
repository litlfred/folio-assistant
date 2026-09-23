---
# folio-assistant-zhg2
title: 'REFERENCE DIRECTION: generalise bootstrap''s no-upward-reference rule to all 17 instances, sharing check:partition''s direction computation'
status: in-progress
type: task
priority: normal
created_at: 2026-09-23T22:51:10Z
updated_at: 2026-09-23T23:21:28Z
parent: folio-assistant-vke6
---

## The rule

Owner, 2026-09-23: *"if sub1 depends (directly or through chain) stub0, no references/context etc points stub0 → sub1."*

`bootstrap-tools/schemas/graph.test.ts` enforces it for ONE instance (`bootstrap/`, bean `iwtn`). This generalises it to all 17.

## Absorbing `check:partition` = sharing its computation

`schemas/layer-direction.ts` (`directionOf` + `allowedFromNeeds`) already answers "does A depend on B, transitively" for `check:partition` and `kg-detangle`. This is its **third consumer**, asking the same question of a name occurrence instead of an import edge.

**The brief that dispatched this recorded `check:partition` at 35 wrong-direction edges, from this bean's own table. It is at 0/0 and ENFORCING both axes** — `jcmx` retired the last edge. Merging the two into one advisory number would have downgraded a passing hard gate, so `check:partition` is untouched and the new check is registered separately.

## The measurement

| | |
|---|---:|
| bounded occurrences up the arrow | 6,878 |
| **wrong-direction** (228 files) | **1,424** |
| exempt (4, each with a reason) | 2,313 |
| undetermined — *not clean* | 3,141 |
| files not read (declared machine-written) | 5,258 |

Three things had to be settled first:

- **Bounded matching.** `folio-assistant` prefixes `folio-assistant-core`, so a substring scan double-counts. The brief's 6,778 was substring; bounded over the same file set is 3,651.
- **The repository-name collision, 59%.** That string names the repository, the product AND the root instance — whose directory *is* the repository root, so every relative path resolves inside it. **Undecidable by name**, so `undetermined`, never a guess.
- **Machine-written files, from the DECLARATION.** `holds` already means this (`state` = written by a process, `derived` = computed). Asked via `isStateGraph`/`isDerivedGraph`, which are false for an unregistered kind — so an unknown kind gets read.

## Confirmed defect

554 occurrences / 156 files once test material and three unmarked projections are set aside. Largest cluster `cat-harness/skills/authoring-who-smart-guidelines/` (106) — `smart-stack-layering.md` 41, `toolchain-ownership.md` 18, `smart-base-tools.md` 14, `ig-artifact-ingestion.md` 14.

## Known gap, named not papered over

`docs/assets/{schemas,beans,voices}/index.json` (440 occurrences) are generated but sit in a `content` graph and carry no self-declaration, so they report as findings. Fix is one line per generator — emit `"_generated"`, as `sync-docs-harness.ts` does — not a path rule in the check.

## Done when

The owner has ruled on the classes in the report, `PENDING` carries what is not being fixed yet with reasons, and the advisory entry flips to `kind: "gate"` pointing at `check:reference-direction:strict` once the count is zero.

## State

Issue #1219, PR #1222, `bun run gates` 137/137. **Not merged** — awaiting the owner's ruling on the classes below.

No `beans/workflows/` instance recorded for this turn: the workflow engine is driven by MCP tools (`workflow_start`/`workflow_next`) that this session does not hold, and hand-writing a state file the engine did not produce would make the store say something no process did.
