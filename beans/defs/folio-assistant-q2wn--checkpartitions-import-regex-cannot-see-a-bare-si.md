---
# folio-assistant-q2wn
title: "check:partition's import regex cannot see a bare side-effect import — and that is how every registration edge is written"
status: todo
type: bug
priority: normal
created_at: 2026-09-21T22:20:00Z
updated_at: 2026-09-21T22:20:00Z
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
