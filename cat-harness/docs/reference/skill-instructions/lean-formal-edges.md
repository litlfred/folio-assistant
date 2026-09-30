---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Lean formal edges (elaborated)'
parent: Skill instructions
---

{: .note }
> Generated from [`folio-assistant-sci/skills/lean/lean-formal-edges.md`](https://github.com/litlfred/folio-assistant/blob/main/folio-assistant-sci/skills/lean/lean-formal-edges.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/folio-assistant-sci/skills/lean/lean-formal-edges.md){: .fa-edit-source }

{% raw %}
# Lean formal edges (elaborated)

## What this is for

The content graph's **formal** relation answers "what does this proof
actually invoke?". It is read from `docs/audits/lean-atlas-deps.json`, and
every entry records where it came from:

| source | how it was made | trust the type/value split? |
|---|---|---|
| `scan` | regex over `.lean` text | **no** — measured recall 0.63 against elaborated ground truth (folio-assistant#1492) |
| `atlas` | Lean Atlas, elaborated | yes |
| `elaborated` | **this extractor**, elaborated | yes |

Consumers branch on `isElaborated(source)` (`content-graph.ts`), never on
`=== "atlas"`. A cache mixing `atlas` and `elaborated` is still fully
elaborated; only a `scan` entry makes it `mixed`.

**These are formal edges. Never write them into `uses[]`** — that is the
editorial relation, owned by `uses-editorial-review`.

## Run it

Needs a Lean toolchain and the folio's Lake project **built** (`lake build`):
the extractor elaborates against the `.olean`s that build produced.

```sh
# CLI — writes <lake-dir>/.lake/formal-edges/edges.jsonl
bun run folio-assistant-sci/content/pipeline/formal-edges.ts \
  --lake-dir <folio Lake project> [--root <content root>] [--ingest]
```

or the MCP tool **`lean_formal_edges`** (`lake_dir`, optional `root`,
`ingest`). `--ingest` / `ingest: true` records the result in the formal
cache as `source: "elaborated"`.

## Read the result — three states, not two

- **extracted** — `N lean.ref targets; E extracted; M not found`.
- **not found** — a tagged declaration the BUILT environment lacks (an
  unbuilt module, a renamed or deleted declaration). It is **listed by
  name and never recorded**: an empty dependency list would read as
  "depends on nothing" when the truth is "was not checked".
- **could-not-determine** — no built modules, or Lean failed. Exit 2 / the
  tool's `isError`. It is **not** a clean result; do not report it as one.

## What an edge means

The rule is LeanArchitect's `collectUsed`, with the folio's `lean.ref`
targets as the tagged set (no `@[blueprint]` attributes, no LeanArchitect
dependency): walk the constants a term uses, recurse **through** untagged
declarations, stop **at** tagged ones. So edges run block to block, with
helper lemmas collapsed.

- `type_deps` — reached from the declaration's **statement** (its type).
- `value_deps` — reached from its **proof** (its value), minus the
  statement set.

Measured on a 691-declaration qou cluster (folio-assistant#1492): 172/172
of LeanArchitect v4.25.0's edges reproduced with 30 % tagged, plus 2
`structure`-field edges LeanArchitect omits. Those are the paper's and our
measurements of a tool, not mathematical claims about the folio.

## Known limits

- **`lean_path` needs the formal-ref layer.** With no formalism layer
  configured, a block whose `.lean` is found only through the Lean package
  resolver carries no `lean_path`, so `--stale` cannot track it. Same gap
  as `--scan`.
- **Built modules only.** A tagged declaration in a module the last
  `lake build` did not produce is reported missing, never guessed.
- **The template is `.lean.tmpl`, not `.lean`** — the platform tracks no
  Lean content. The driver writes the filled copy into the folio's own
  `.lake/formal-edges/Driver.lean`.

## See also

- `lean-formal-graph` (core) — building and querying the graph these
  edges feed.
- `folio-assistant-sci/methodologies/blueprint-driven-formalization.md` —
  why blueprint `\uses` should be computed from Lean, and why LeanArchitect
  itself was not adopted (folio-assistant#1492).
{% endraw %}
