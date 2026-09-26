---
# folio-assistant-bf5l
title: 'WRONG DIRECTION on main: cat-harness/schemas/intake.ts imports folio-assistant-core, and two of three checks cannot see it'
status: todo
type: task
created_at: 2026-09-26T04:01:42Z
priority: high
parent: folio-assistant-1xhc
updated_at: 2026-09-26T04:01:42Z
---


`cat-harness/schemas/intake.ts:28`:

```ts
import { ProvenanceSchema } from "../../folio-assistant-core/schemas/materialization.js";
```

`cat-harness` declares `needs: ['bootstrap']`. `folio-assistant-core` declares
`needs: ['cat-harness']`. So the code adds a **harness → core** edge against a
declared **core → harness** dependency. The declarations alone have no cycle;
the declarations plus the code do.

## Three checks look at this. One sees it.

| check | what it reads | verdict |
|---|---|---|
| `check:instance-graph` | the declarations only | ✓ 16 instances, no cycle |
| `check:partition` | modules bucketed by PATH RULE into 5 packages | 0 wrong-direction |
| `kg:detangle` | a node's layer is its INSTANCE | **1 wrong-direction** |

`kg:detangle` is the one that is right, and it says why:

> `wrong-direction — 'cat-harness' does not declare 'folio-assistant-core'
> among what it may reach`

The other two are not broken. They answer different questions, and neither
question is "does this file's directory agree with what it imports". That is
worth keeping in view: **three green checks did not mean the layering held.**

## Why this is not an import swap

There are TWO `ProvenanceSchema` exports:

| where | shape |
|---|---|
| `cat-harness/schemas/attribution.ts:115` | `z.union([z.literal(INGESTED), AttributionSchema])` |
| `folio-assistant-core/schemas/materialization.ts:272` | the `upstream` / `local` shape |

`intake.ts`'s own docblock says it wants *"where the capture came from |
`ProvenanceSchema` (`upstream` / `local`)"* — core's shape, not the harness's.
So pointing the import at the local one compiles and means something else.
Two different concepts under one name is arguably the deeper defect here.

## The options, none of them taken

1. **Move the `upstream`/`local` provenance down** into `cat-harness` (or
   `bootstrap`) and have core import it. Fixes the direction. Cost: core's
   `materialization.ts` is 27 KB and the schema may not travel alone.
2. **Move `intake.ts` up into `folio-assistant-core`.** An intake record is
   arguably core content, not harness plumbing. Cost: `intake.ts` imports
   `./archive-contents.js`, which would then also have to move or be reached
   downward.
3. **Declare `cat-harness` needs `folio-assistant-core`.** Cheapest edit,
   and it creates a declared cycle — `check:instance-graph` would then fail,
   correctly.
4. **Rename one of the two `ProvenanceSchema`s first**, then decide. The
   collision is what made option 1 look free when it is not.

## Done when

- [ ] The owner rules which of the four (or a fifth).
- [ ] `kg:detangle` reports 0 wrong-direction, and the sidecar records it.
- [ ] Whatever is chosen, the two `ProvenanceSchema` exports are either
      reconciled or deliberately distinguished by name.

## Not claimed

Found while answering *"where are we in code separation"* (2026-09-26). The
same session shipped the gate that makes this visible — `wrongDirection` is
now pinned in the detangle sidecar, so the count cannot change again without
failing `kg:detangle:check`. **That gate is the fix for the blindness; this
bean is the fix for the edge, and it is a layering decision, which `j79e`
records as the owner's.**

---

## Options

Recorded as a `DecisionRequest` and rendered with `renderDecision`, per bean
`hajp` — not hand-written. The four options were in this bean's prose from
2026-09-26 and that was NOT enough: `hajp` requires anything with more than two
options to exist as a record, so the prose table and the selection come from one
object that cannot disagree with itself. Omitting it was my defect, named by the
owner the same day.

**Choice: not yet made. Awaiting the owner.** This section is updated with the
choice and who made it when it is.

Which side of a harness→core import inversion moves. Today `cat-harness/schemas/intake.ts:28` imports `folio-assistant-core/schemas/materialization.js`, while `folio-assistant-core` declares that it depends on `cat-harness`. So the code points one way and the declarations point the other. Your answer decides whether a schema moves down into the harness, a file moves up into core, the declared layering changes, or a name collision is settled first — and until it is answered `kg:detangle` records `wrongDirection: 1` on main forever.

- **`bf5l`** — the bean holding this — the wrong-direction edge found 2026-09-26 while assessing code separation
- **`cat-harness`** — the platform instance: skills, schemas, MCP server. Declares `needs: ['bootstrap']`
- **`folio-assistant-core`** — the content-model instance: document/paper schemas, authoring, render. Declares `needs: ['cat-harness']`
- **`intake.ts`** — cat-harness/schemas/intake.ts — an intake record, `folio-intake/v1`: what one capture put into uploads/
- **`ProvenanceSchema`** — a name that exists TWICE with different shapes: `attribution.ts:115` is `INGESTED | Attribution`; `materialization.ts:272` is the `upstream`/`local` shape. `intake.ts` wants the second
- **wrong-direction** — an import that points up the declared dependency order; `kg:detangle` counts them and, since #1375, pins the count in a committed sidecar
- **`#223`** — the issue proposing the five-repo split; the partition's target names come from it

| | **Rename one ProvenanceSchema first, then decide** *(recommended)* | Move the upstream/local provenance down into cat-harness | Move intake.ts up into folio-assistant-core | Declare that cat-harness needs folio-assistant-core |
|---|---|---|---|---|
| **What it does** | Give the two same-named schemas distinct names, then re-ask which side moves with the collision out of the way. | Relocate the `upstream`/`local` shape out of core's `materialization.ts` into a cat-harness schema, and have core import it from there. | Relocate `intake.ts` from cat-harness to core, where the schema it wants already lives. | Add `folio-assistant-core` to cat-harness's `needs`, making the existing import legal by declaration. |
| **Pro** | Removes the thing that made option 1 look free. Two different concepts under one name is arguably the deeper defect, and it is independent of the layering question. | Fixes the direction without moving any intake logic, and puts a genuinely generic provenance shape where both layers can reach it. | An intake record is arguably core content rather than harness plumbing, so this fixes the layering and the filing in one move. | One line, no code moves, and `kg:detangle`'s count goes to zero immediately. |
| **Con** | Does not fix the wrong-direction edge, so `wrongDirection: 1` stays on main and this decision returns. | `materialization.ts` is 27 KB and the schema may not travel alone — it likely references sibling types in the same file, so the move could pull more than intended. | `intake.ts` imports `./archive-contents.js`, which would then also have to move or be reached downward — so this is two moves, not one, and the second may cascade. | It creates a DECLARED cycle — core needs cat-harness and cat-harness needs core — which `check:instance-graph` would then fail, correctly. It trades a code-level inversion for a declaration-level one. |
| **Downstream** | Every importer of whichever name changes. Afterwards options 1 and 2 are both cheaper to judge, because the reader can see which shape each site actually wanted. | Every current importer of core's `ProvenanceSchema` changes its import path. The name collision with `attribution.ts` REMAINS, so the next reader still meets two `ProvenanceSchema`s and may pick the wrong one. | Shrinks cat-harness's schema surface and grows core's, which shifts where `#223` cuts. Anything importing `intake.ts` from the harness side inverts and becomes a NEW wrong-direction edge. | Makes the two instances mutually dependent, so #223 cannot cut them into separate repositories at all without undoing this first. It converts a local defect into a structural one. |
| **Reversibility** | A rename is mechanical and reversible; nothing structural is committed. | Cheap to undo while both repos are one checkout; expensive after #223 cuts them, because the schema would then live in the other repository. | Same as above while pre-split; a file's home is the thing #223 hardest to change afterwards. | The edit is trivial to revert, but anything written against the widened reach in the meantime is not. |

**Recommendation: Rename one ProvenanceSchema first, then decide** — The collision is why I could not judge options 1 and 2 when I found this. `intake.ts` wants core's `upstream`/`local` shape while its own instance already exports a DIFFERENT `ProvenanceSchema` under the same name — so a reader checking whether the import could just point locally gets a compiling, wrong answer. Options 1 and 2 both move something across a boundary, which is the expensive and least reversible class of change here, and both are easier to judge once each call site's intent is legible. Option 3 I would not take at all: it converts a one-file defect into a declared cycle that blocks #223, and `check:instance-graph` would fail it.

**If you say nothing:** Nothing. The edge stays, `wrongDirection: 1` stays pinned in the committed sidecar where #1375 put it, and it is visible rather than silent — which is what that PR was for. I will not pick a layering myself.

4 other decisions are waiting; I will put each properly when it is next.

Which of the four? Or if the rename is obviously right and you want it done without a second round, say so and I will rename and then re-ask the layering with the collision gone.

### Source

The object is built and rendered rather than pasted, so it cannot drift from
what was asked. To re-render or amend, rebuild the `DecisionRequest` against
`cat-harness/schemas/decision-request.ts` — the schema has no optionals, so an
option missing its `downstream` or `reversibility` will not parse.

