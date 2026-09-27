---
# folio-assistant-p11x
title: 'check:partition cannot see cross-instance edges: its ROOT is cat-harness/, so every 0 it reports is scoped to one instance'
status: todo
type: bug
priority: normal
created_at: 2026-09-27T09:52:20Z
updated_at: 2026-09-27T09:52:59Z
parent: folio-assistant-1xhc
---

Opened 2026-09-27 because **`bf5l` asked for it and it did not exist.** That
bean's closing section says, of making the blind checks see the edge it found:
*"Making the blind checks see it is NOT done here … it wants its own bean."* A
corpus-grep across `beans/defs/` and `beans/defs/archive/` found no such bean, so
`bf5l` completed with its follow-up unrecorded.

## What is measured

Verified directly, not carried from `bf5l`:

| evidence | value |
|---|---|
| `cat-harness/scripts/partition/instance-rules.ts:1747` | `export const ROOT = resolve(import.meta.dir, "..", "..")` — resolves to **`<checkout>/cat-harness`** |
| `:1755` | `SCAN_ROOTS = ["src","schemas","adapters","content","scripts","test","types"]`, relative to that ROOT |
| `repo-partition.ts --repo core` | **257** paths, **0** beginning `folio-assistant-core/` |
| checkout root | `folio-assistant-core/`, `folio-assistant-sci/`, `smart-base/` all **exist** and are outside the scan; `smart-kg/` does not exist |

So the five buckets assign **cat-harness's own ~1200 modules** to future repos.
Every `0 wrong-direction edges` the tool prints is scoped to one instance, and it
is silent about imports between the already-extracted siblings.

## Why that is a defect rather than a documented limitation

`bf5l` measured the discriminator and it is not theoretical. With a real
wrong-direction import in place (`cat-harness/schemas/intake.ts` importing
`folio-assistant-core`):

| check | what it reads | verdict with the sabotage in place |
|---|---|---|
| `check:instance-graph` | declarations only | ✓ no cycle |
| `check:partition` | modules bucketed by PATH RULE | **0 wrong-direction** |
| `kg:detangle` | a node's layer is its INSTANCE | **1 wrong-direction** |

`bf5l`'s own sentence: ***"three green checks did not mean the layering held."***
`zhg2` independently measures **8** real `cat-harness → folio-assistant-core`
imports invisible to `check:partition`.

## Why it matters now rather than later

`migration-plan.md:165-175` makes Phase I.1 *"resolve each wrong-direction
cross-edge"* with the gate *"the list is empty or every survivor has a written
reason"*, and I.1b puts `check:partition --strict` in CI so *"a new edge fails the
PR that introduces it"*. `repo-partition.ts:170-197` records both axes at zero
and enforced, and treats that as I.1 discharged.

**A gate that cannot see the cross-instance axis discharges I.1 for one instance
and reports it as done.** That is `1xhc`'s thesis exactly — *a gate that does not
fire is indistinguishable from one that passed* — which is why this is parented
there rather than under `vke6`, even though the work is partition-shaped.

It also means a reader of any PR citing `wrong-direction: 0` gets an
over-broad claim unless the PR says which scope. That happened on #1465 and was
corrected there by comment; the fix belongs here, not in per-PR prose.

## Options, none chosen — this is the owner's call

1. **Widen `SCAN_ROOTS`/`ROOT` to the checkout.** Directly addresses it. Cost: the
   partition then classifies ~17 instances' modules, and `instance-rules.ts`'s
   path rules are written against cat-harness-relative paths — most would need a
   prefix dimension. Risk: a large reclassification, and `--strict` in CI would
   start failing on `zhg2`'s 8 known imports, which are not yet triaged.
2. **Leave `check:partition` instance-scoped and make `kg:detangle` the
   cross-instance gate**, since it already sees the axis (it is the one check
   that caught `bf5l`'s sabotage). Cost: near zero in code; it is a statement
   about which check owns which question, plus wiring `kg:detangle`'s
   wrong-direction count into CI as blocking.
3. **Name the scope in the output.** Cheapest, and not a fix: print
   `wrong-direction edges (scope: cat-harness/)`. Stops the over-broad read
   without making anything visible.

**Not established:** whether `zhg2`'s 8 are all real or partly artefacts of its
own widened detector — its PR #1222 is delivered, green and **not merged**, with
343 findings still `PENDING`. Any of the three options above should be measured
against a triaged set, not against 8 untriaged hits.

**Default if nothing is done:** `check:partition` keeps reporting 0, Phase I.1
stays discharged on one instance's evidence, and the next PR to cite the number
repeats the over-broad claim.
