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
