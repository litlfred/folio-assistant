---
# folio-assistant-mer2
title: folio_init takes no layer argument, so the ruled MVP definition is not expressible
status: todo
type: task
priority: normal
created_at: 2026-09-30T21:47:07Z
updated_at: 2026-10-01T06:51:19Z
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


## RULED 2026-10-01 — SPLIT THE OPERATION, do not add `--layer`

The owner chose, from three options compared in full, after I put the measurement
below to them:

> **An instance-init writing the instance-level artefacts with no content type,
> and `folio_init` = instance-init + the adapter's folio scaffold.**

### The measurement that produced the question

The owner asked what a bare `agentic-harness` knows about bootstrap KG concepts,
schemas and content such as READMEs. Measured from the declarations:

| instance | declares | has a `folio` kind? |
|---|---|---|
| `bootstrap` | `skills`, `schemas`, `scenarios`, `processes`, `models` | **no** |
| `bootstrap-tools` | `schemas`, `code`, `skills` | **no** |
| `cat-harness` | 50 directories across 27 kinds | yes — exactly **one** |

So the harness layers know KG concepts, schemas, processes and scenarios, and
know nothing about content. Then `folio_init`'s writes, split by what they need:

**Instance-level — no content type, no adapter:** `.beans.yml`,
`beans/.gitkeep`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.mcp.json`,
`.claude/settings.json`, `.gitignore`, `README.md`, `<slug>.json`,
`<slug>.config.json`, `todos/` (four paths).

**Folio-level — needs the adapter:** `folio/schema/builders.ts`,
`folio/schema/types.ts`, the document + chapter + first block manifests,
`library/README.md`, `uploads/README.md`, `.github/workflows/staging.yml`.

**The great majority is instance-level.** A bare `agentic-harness` can therefore
be scaffolded COMPLETELY — declaration, work plan, agent guidance, MCP wiring,
todos. The only things it cannot have are `folio/` and the builder shim, which
belong to an adapter it has none of.

So `folio_init` conflates two operations, and that — not a missing flag — is why
the ruled MVP read as inexpressible. The earlier finding on this bean stands
(11 flags, 0 naming a layer; zero adapters at the harness layer) but its
CONCLUSION is superseded: the fix is not to teach `folio_init` about layers, it
is to separate the layer-independent half.

### Why a `--layer` flag was rejected

It forces an answer to *"which content type does a contentless layer
scaffold?"*, which has none. Either the flag means something different per
layer, or a content type gets invented for the harness. The scope question I
recorded as the owner's — what a bare `agentic-harness` should scaffold — is
answered by the split rather than decided: **an instance, not a folio.**

### What this does for `zmdo` and `x3bd`

`zmdo`'s per-layer MVP becomes evaluable: *instance-init against that layer
alone succeeds, and the checkout can claim a bean, read the conventions and run
the next step.* That is **word for word** what `x3bd` already demanded of a
bootstrap-only checkout, written eleven days earlier and independently. One
primitive serves both, which was the reason to look for one.

## Done when — restated on the ruling

1. [ ] An instance-init that writes the instance-level artefacts and takes no
       content type.
2. [ ] `folio_init` becomes instance-init + the adapter's folio scaffold, with
       its current behaviour unchanged for a folio.
3. [ ] The probe asserts what it produced — a declaration that loads and graphs
       that resolve — rather than inferring success from exit 0.
4. [ ] `x3bd`'s bootstrap-only test and `zmdo`'s per-layer MVP both run through
       it.
