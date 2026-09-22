---
# folio-assistant-q2wn
title: check:partition's import regex cannot see a bare side-effect import — and that is how every registration edge is written
status: in-progress
type: bug
priority: normal
created_at: 2026-09-21T22:20:00Z
updated_at: 2026-09-21T23:05:00Z
parent: folio-assistant-vke6
---

Found 2026-09-21 while measuring `x4a6`, and **not fixed there** because it is
about the partition checker rather than about graph kinds.

`scripts/partition/engine.ts`:

```ts
const IMPORT_RE = /(?:^|\n)\s*(?:import|export)[\s\S]{0,400}?from\s*["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)/g;
```

Two alternatives: a statement containing `from`, and a dynamic `import()`.
**Neither matches `import "./x.js";`** — the bare side-effect form, which has
no `from` and no binding.

## Why that is not a corner case here

**Every registration edge in this repository is written that way.** Measured:
of the import statements naming `folio-graph-kind`, **all** are bare
side-effect imports. The module exists to run for its side effect, so it has
nothing to bind and the form is not a choice.

So the one mechanism that computes this repository's module edges is blind to
the entire class of edge that carries load-time registration — the class whose
absence produces `unknown graph kind`, and which `bunfig.toml` records already
costing a green-local/red-CI split on 2026-09-20.

## What this does and does not mean

**Not established:** that `check:partition` reports a wrong verdict today. Its
subject is LAYER boundaries, and a side-effect import may or may not cross one
in a way its rules would flag. That needs measuring before any claim.

**Established:** the edges are invisible to it, so if one ever did cross a
boundary, the check could not say so — and would report a clean run over it.
That is the `dh4f` shape, sitting inside the tool meant to catch structure
problems.

## A second flaw in the same regex, found the same way

`[\s\S]{0,400}?` scans FORWARD from `import` looking for `from`. Given a bare
`import "./a.js";` followed within 400 characters by a normal
`import { x } from "./b.js";`, it matches from the first `import` to the
second's `from` — consuming the bare import and attributing `./b.js` as the
specifier. So the bare form is not merely missed; it can make a NEIGHBOURING
edge report the wrong source line.

Reproduced while writing a walker with the same pattern: `translation.ts:28` is
`import "../../schemas/folio-graph-kind.ts";` and the walk reported the module
as not reaching a file it imports directly.

## Done when

- [ ] `IMPORT_RE` matches the bare side-effect form, with a test carrying the
      two-imports-within-400-characters case above.
- [ ] Measured, before and after: how many edges this adds, and whether any
      crosses a layer boundary `check:partition` would flag. **A count that
      changes is not by itself a defect found** — report both numbers.
- [ ] A decision recorded on whether a side-effect import counts as a layer
      dependency for partition purposes. It is a real runtime dependency; it
      carries no type. Those can differ and the answer should be written down
      rather than implied by a regex.

*Recorded by session_017MEZnJxx7WeekiNCabx4hx, which found it and did not
pivot to it.*

---

## Measured 2026-09-21 — the blind spot hides 25 forbidden edges

Done-when 2, run with the engine's **own** `analyse()` against its own `SPEC`,
changing nothing but `IMPORT_RE` in a scratch copy:

```
                     current    with bare side-effect imports
total edges             1886    1961   (+75)
CROSS-BOUNDARY             0      25   (+25)
unresolved                 0       0
```

*Re-verified after merging 11 commits from `main`, including #822's relocation
of `skills/workflows/` to `processes/`. The total moved 1875 → 1886 as main
added modules; **the +75 and the +25 did not move at all**. A relocation of
that size is exactly what could have invalidated the figure, so it was re-run
rather than carried forward.*

`check:partition` exits **0** today and reports **zero** cross-boundary edges.
Make the bare form visible and there are **25** — every one `harness → core`,
every one pointing at `schemas/folio-graph-kind.ts`, from **24 distinct
harness-layer modules**. Spot-checked rather than trusted:
`scripts/check-waivers.ts:54` and `src/tools/skill-fetch.ts:20` both carry it.

### This is no longer a tidy-up

The bean was opened expecting a regex gap. The measurement says the gap is
load-bearing: **the registration mechanism requires the harness layer to
import core, and the declared layering forbids exactly that.** `harness` is
the lower layer; `allowed["harness"]` does not list `core`, which is why
`analyse()` classes all 25 as cross-edges.

So the three Done-whens are not independent, and the order in this bean is
wrong. Fixing `IMPORT_RE` first turns a green gate red with 25 violations that
describe a real design tension rather than a mistake anybody made. **Done-when
3 has to be settled first**, and it now has teeth it did not have when it was
written as a tidy question about regex scope.

### What is established, and what is not

**Established.** 75 edges are invisible; 25 of them are cross-boundary under
the rules as they stand today; the check passes today and would not after.

**NOT established.** That `harness → core` *should* be forbidden for an import
that binds nothing and exists only to run a registration. That is the open
question, and the measurement sharpens it rather than answering it: a
side-effect import is a real runtime dependency and carries no type, so the
two halves of "dependency" genuinely disagree here. `x4a6` measured the other
side of the same mechanism — 31 of 31 readers reach the registration — so it
works; the question is whether the layering should say it may.

Also worth keeping: the tool already has a third state, and says so in its own
output — *"These are not cross-edges — they are edges this tool declined to
judge."* Whatever is decided, an edge it cannot judge should not silently
become an edge it never saw.

## Done when

- [ ] `IMPORT_RE` matches the bare side-effect form, with a test carrying the
      two-imports-within-400-characters case. **Blocked on the decision below,
      not on effort** — landing it alone reds the gate.
- [x] Measured, before and after: **+75 edges, +25 cross-boundary**, all
      `harness → core` to `folio-graph-kind.ts`.
- [ ] **A decision on whether a side-effect import counts as a layer
      dependency**, now with the consequence attached: counting it makes 25
      currently-invisible edges violations. The options are an `allowed` edge
      for registration, a third classification beside `cross` and
      `declined-to-judge`, or moving the registration so the harness need not
      reach for it — and the third contradicts what `folio-graph-kind.ts`
      exists to defend.
