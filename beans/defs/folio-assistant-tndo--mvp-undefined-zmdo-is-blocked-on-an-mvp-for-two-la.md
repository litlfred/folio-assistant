---
# folio-assistant-tndo
title: 'MVP UNDEFINED: zmdo is blocked on an MVP for two layers that nothing defines, so GOAL 1''s own falsifier cannot be evaluated'
status: todo
type: task
priority: normal
created_at: 2026-09-30T11:33:55Z
updated_at: 2026-09-30T19:49:33Z
parent: folio-assistant-vke6
---

## The finding, and how it was measured

`beans/defs/folio-assistant-zmdo--split-*.md` is the bean that forks
`agentic-harness` and `folio-assist-core` and proves an empty-repo bootstrap. It
is parented to `vke6` (SPLIT #223), under GOAL 1 `vuip`. Three lines of its own
body:

- line 15, the owner's verbatim ask: *"when we get to an MVP for agent-harness
  and folio-assist-core, create"*
- line 46: *"**Blocked on MVP** of both layers. Do not start the forks before
  then"*
- line 75: *"Nothing here is measured. MVP is not defined for either layer, no
  fork has …"*

So the bean is blocked on a term, the bean itself records that the term is
undefined, and no other bean defines it. Provenance: read out of that one file
on `claude/cool-fermi-htir5p` at parity with `origin/main`, 2026-09-30.

## Why this blocks GOAL 1 rather than just one item

GOAL 1 is repo separation. `zmdo` is the step where the separation becomes real
— two repositories that actually exist — and therefore it is GOAL 1's own
falsifier: until it runs, "the layers can depend on each other" has been
demonstrated only inside one checkout. An undefined blocker cannot be cleared
and cannot expire, which is the shape `bean-blocking` rejects: *"a block with no
expiry cannot be told from abandoned work"*. `zmdo` has no expiry because
nothing can compute one from an undefined term.

**This bean does not propose the definition.** MVP for a layer is a scope call,
and scope is the owner's. What it asserts is only that the term is load-bearing
and absent.

## Done when

1. MVP is written down for `agentic-harness` and for `folio-assist-core`, as
   checkable conditions rather than a judgement — the owner's words, recorded.
2. `zmdo` carries either an expiry or a condition a check can evaluate, so
   `bean-blocking`'s rule is satisfiable.
3. GOAL 1's queue states, with a denominator, how many of its open items are
   blocked on this one term.


## RULED 2026-09-30 — MVP is BOOTSTRAP-PROVABLE

The owner chose, from four options compared in full:

> **MVP = `folio_init` creates a working folio against that layer ALONE, in an
> empty repository.**

Chosen over three alternatives, each recorded so the reasoning survives:
*self-contained gates pass* (nearest term, but passing gates in-tree is not
evidence the SPLIT works); *a real downstream builds on it* (strongest evidence,
but couples the timeline to a folio's); *expiry only, define nothing* (unblocks
the bookkeeping rule without answering GOAL 1's falsifier).

### Why this one is satisfiable where the others were not

`bean-blocking` rejects a block with no expiry because *"a block with no expiry
cannot be told from abandoned work"*. `zmdo` had no expiry because nothing could
compute one from an undefined term. This definition is **runnable**, so the
block now has a condition a check can evaluate rather than a judgement to wait
on.

It is also what `zmdo` already set out to prove — its own body says the fork
"proves an empty-repo bootstrap". The definition and the falsifier are now the
same act rather than two.

### Checkable conditions, per layer

For each of `agentic-harness` and `folio-assist-core`, independently:

- [ ] `bun run init-folio` against **that layer alone** — no sibling instance on
      disk, no other layer linked — exits 0 in an empty repository.
- [ ] The scaffolded folio's declared graphs RESOLVE: every directory named in
      its `<instance>.json` exists, and no declared-but-absent entry (the `dh4f`
      defect, where a consumer scans nothing and reports a clean run).
- [ ] That folio's own gate set passes in the fresh repository, not only in this
      checkout.
- [ ] The layer's `needs:` closure is satisfied by what is actually present —
      i.e. the bootstrap did not silently depend on a layer above it.

**Each is a command, not an opinion.** That is the whole point of the choice:
the owner's other three options all required somebody to judge readiness.

### What this does NOT settle

- **When** the conditions will hold. This defines the bar; it does not schedule
  it. `zmdo` stays blocked, but now on something computable.
- Whether `folio_init` currently CAN target a single layer. If it cannot, that
  is a finding against `folio_init` rather than a reason to weaken the
  definition — and it is the first thing to measure.

## Done when — status

1. [x] MVP written down for both layers as checkable conditions, in the owner's
       terms, recorded here.
2. [ ] `zmdo` carries the condition, so `bean-blocking`'s rule is satisfiable.
3. [ ] GOAL 1's queue states, with a denominator, how many open items are
       blocked on this term.

## MEASURED 2026-09-30 — done-when 2 and 3, and a finding against `folio_init`

The owner's ruling settled done-when 1: **MVP = `folio_init` creates a working
folio against that layer ALONE, in an empty repository.** Done-when 2 and 3 are
answered below, and answering 2 turned up a defect in the thing the definition
measures against.

### The definition is not evaluable today, and that is `folio_init`'s problem

**`folio_init` takes no layer argument.** Measured from
`cat-harness/scripts/init-folio.ts` — `InitFolioOptions` and `parseArgs` — on
this branch:

| | |
|---|---|
| CLI flags accepted | **11** |
| of those naming a layer | **0** |

The eleven are `--dir --type --slug --title --author --link --assistant --force
--dry-run --skip-vcs --help`. The nearest candidate is `--assistant`, and it is
not one: its own docblock says *"Path to the folio-assistant checkout"* — the
**whole stack**, not one layer of it. `instanceRoot` is
`resolve(import.meta.dir, "..")`, hardcoded to the platform checkout the script
lives in.

So the MVP condition cannot be run for either layer. **That is a finding against
`folio_init`, not grounds to weaken the definition** — the owner chose
bootstrap-provability over *self-contained gates pass* precisely because passing
gates in-tree is not evidence of a separable layer, and softening the term to
fit the current CLI would hand back the property the ruling bought.

### A sharper problem: for `agentic-harness` the condition is currently unsatisfiable

`BUILTIN_ADAPTERS` in `cat-harness/src/builtin-adapters.ts` already carries a
`layer` per adapter, so the layer notion exists — as a **label on the adapter**,
describing where its module lives, never as an input. Both rows sit **above**
`cat-harness`:

| contentType | module | layer |
|---|---|---|
| `paper` | `../folio-assistant-sci/adapters/paper/index.ts` | `sci` |
| `document` | `../folio-assistant-core/adapters/document/index.ts` | `core` |

**Zero adapters at the `agentic-harness` layer.** `folio_init` against that layer
alone therefore has no content type to scaffold at all: "a working folio against
agentic-harness ALONE" is not merely unimplemented, it is unsatisfiable as the
code stands. For `folio-assist-core` the `document` adapter is in the right
place, so that half of the MVP is reachable once the flag exists.

**And the failure would be quiet.** When the asked adapter is unavailable the
resolver falls back to another content type with a warning — *"contentType X
declares the Y adapter, which is unavailable … using Z instead"*. An MVP probe
reading only "did a folio get created" would score a **pass** on a folio of the
wrong content type. Any check written for this definition must assert the
content type it got, not merely that files appeared. This is bean `1xhc`'s shape
— a gate that does not fire looks like one that passed — one layer along.

### Done-when 2 — `zmdo` records its block in PROSE, in a field nothing reads

`zmdo`'s body says *"**Blocked on MVP** of both layers. Do not start the forks
**before** then"*. Its front matter carries **no `blocked_by`**.

The field is real and it is used: `blocked_by:` appears in the front matter of
**11** beans in `beans/defs/`. `zmdo` is not one of them. So the strongest
statement of the block in the whole store is unreadable by any check, which is
why `bean-blocking`'s rule — a block carries what it waits on, since, an expiry
and a handoff — reads as unsatisfied here no matter what the prose says.

Done-when 2 is therefore **not yet met**, and the remedy is now concrete rather
than a judgement.

**DONE, 2026-09-30, and not as first written.** The first attempt pointed
`zmdo`'s `blocked_by` at *this* bean, which is wrong: the term `tndo` exists
about is now **ruled**, so `zmdo` is not waiting on it. What `zmdo` waits on is
`folio_init` growing a layer argument, which nothing owned — checked before
creating, and the three other beans matching `--layer` use it in unrelated
senses (IG chrome layers, a glossary example, a `check:tools` example). Created
as `mer2` and wired both ways: `mer2` carries `blocking: [zmdo]`, `zmdo` carries
`blocked_by: [mer2]`.

**The hazard that cost, worth the two lines:** `blocked_by` is a YAML **list**.
Writing it by hand as a scalar — `blocked_by: folio-assistant-tndo` — made
*every* `beans` command fail, store-wide, with `cannot unmarshal !!str into
[]string`. Not the edited bean: the whole store, because the CLI loads all 518
before doing anything. And the failure surfaced as a **usage dump** from
`beans create`, so the first reading was "my title is malformed". One
hand-edited scalar in one file is a total outage of the work-plan tool,
diagnosable only by running an unrelated command. `beans update <id>
--blocked-by <id>` writes the list form correctly; the correction above was made
that way.

### Done-when 3 — the denominator

Computed over all 517 beans in `beans/defs/`, walking `parent` transitively to
GOAL 1 (`vuip`):

| | count |
|---|---|
| beans under GOAL 1, transitively | 57 |
| of those **open** (`todo`/`in-progress`/`blocked`/`draft`) | **46** |
| open GOAL 1 items whose body names `MVP` or `zmdo` | 7 |
| open GOAL 1 items **blocked on this term** | **1** — `zmdo` |
| of those carrying a machine-readable `blocked_by` | **0** |

**1 of 46, not 7 of 46.** The seven-way match is what a grep gives, and four of
the seven matched on a `zmdo` *mention* rather than a dependency; `jut3`'s `MVP`
line is a quoted owner ask about the IG publisher — a different MVP entirely.
Reporting 7 would have overstated the blast radius by sevenfold, and the whole
point of a denominator is that it be honest in both directions.

So the term blocks **one** item — but that item is GOAL 1's own falsifier, which
is why it was worth defining rather than deferring. The rest of GOAL 1's 46 open
items are not waiting on it.

### What this bean now waits on

Nothing from the owner. Done-when 1 is ruled; 2 and 3 are measured. What remains
is work, and it is `folio_init`'s: a layer argument, and a probe that asserts the
content type it received. Recorded as its own item rather than done here, because
the ruling asked for a definition and this bean's scope was the definition.
