---
# folio-assistant-mer2
title: folio_init takes no layer argument, so the ruled MVP definition is not expressible
status: todo
type: task
created_at: 2026-09-30T21:47:07Z
updated_at: 2026-09-30T21:47:07Z
parent: folio-assistant-vke6
blocking:
    - folio-assistant-zmdo
---

## The finding, and how it was measured

The owner ruled, 2026-09-30, that **MVP for a layer = `folio_init` creates a
working folio against that layer ALONE, in an empty repository** (`tndo`,
chosen from four candidates). `zmdo` turned that into four checkboxes and named
the first thing to measure: *"whether `folio_init` can target a single layer at
all today. If it cannot, that is a defect against `folio_init` — not a reason
to weaken the definition."*

Measured on `claude/cool-fermi-htir5p`, from `cat-harness/scripts/init-folio.ts`
(`InitFolioOptions` and `parseArgs`):

| | |
|---|---|
| CLI flags accepted | **11** |
| of those naming a layer | **0** |

`--dir --type --slug --title --author --link --assistant --force --dry-run
--skip-vcs --help`. `--assistant` is the near miss and is not one — its docblock
says *"Path to the folio-assistant checkout"*, the **whole stack**. `instanceRoot`
is `resolve(import.meta.dir, "..")`, hardcoded to the platform checkout the
script lives in.

So the MVP condition is not *failing*; it is **not expressible**. None of
`zmdo`'s four boxes can be evaluated for either layer.

## Two things that shape the fix

**1 — the layers are not symmetrically blocked, so `core` goes first.**
`BUILTIN_ADAPTERS` already carries a `layer` per adapter, as a label describing
where a module lives rather than an input:

| contentType | module | layer |
|---|---|---|
| `paper` | `../folio-assistant-sci/adapters/paper/index.ts` | `sci` |
| `document` | `../folio-assistant-core/adapters/document/index.ts` | `core` |

**Zero adapters at the `agentic-harness` layer.** A folio needs a content type;
every content type's adapter lives higher. So "a working folio against
agentic-harness alone" has nothing to scaffold — unsatisfiable as the code
stands, not merely unimplemented. `core` is reachable the moment the flag
exists, because `document` is already in `core`.

**2 — the probe must assert the content type it got.** When the asked adapter
is unavailable the resolver does not fail; it falls back with a warning —
*"contentType X declares the Y adapter, which is unavailable … using Z instead
— tools specific to Y are NOT registered"*. A probe reading only "exited 0 and
wrote files" scores a **pass** while holding a folio of a content type nobody
asked for. That is `1xhc` reached through a fallback rather than a skipped step.

## One switch, two callers

`x3bd` already carries the same test one layer down: *"a checkout with ONLY
`bootstrap/` and `cat-harness.json` must let an agent claim a bean, read the
conventions and run `folio_init`. If it cannot, the list is wrong. Worth a CI
job."* Written eleven days earlier and independently, and it is the owner's MVP
definition applied to `bootstrap/`. Whatever switch `folio_init` grows should
serve both; neither should grow its own.

## Done when

1. `folio_init` accepts a layer and scaffolds against that layer alone, with no
   sibling instance on disk.
2. The probe asserts the **content type of the folio it produced**, not merely
   that `init-folio` exited 0 — so the resolver's silent fallback cannot be read
   as a pass.
3. What a bare `agentic-harness` should scaffold, if anything, is put to the
   owner as a scope question rather than decided here. It has no content type
   today, and inventing one is not this bean's call.
4. `x3bd`'s bootstrap-only test and `zmdo`'s per-layer MVP both run through the
   same switch.

## Not in scope

**Weakening the MVP definition to fit the current CLI.** The owner chose
bootstrap-provability over *self-contained gates pass* precisely because passing
gates in-tree is not evidence of a separable layer; softening the term hands
back the property the ruling bought.
