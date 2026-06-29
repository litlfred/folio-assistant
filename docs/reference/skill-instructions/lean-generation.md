---
layout: default
title: Lean File Generation
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-paper-adapter/lean-generation.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-paper-adapter/lean-generation.md) — do not edit here.

{% raw %}
# Lean File Generation

## Overview

This skill covers the pipeline from LaTeX mathematical content to Lean 4
formalization stubs.  It bridges the gap between human-readable proofs in
the manuscript and machine-checkable formal proofs.

## When to Use This Skill

- When new theorem/definition/lemma environments are added to chapter files
- When running the proof object extraction pipeline
- When generating or updating Lean stub files
- When adding `\lean{}`, `\leanok`, or `\uses{}` macros to LaTeX

## Lean MCP Tools (paper-assistant)

When the MCP server is available, **prefer MCP tools over shell commands**:

| Old workflow | MCP tool | Why better |
|-------------|----------|-----------|
| `lake build` + parse output | `lean_diagnostic_messages` | Structured errors/warnings per file |
| Manual file reading for structure | `lean_file_outline` | Concise view of imports + declarations with type sigs |
| `lake build` for sorry count | `lean_diagnostic_messages` | Filter for sorry warnings directly |
| Manual cross-checking declarations | `lean_hover_info` | Verify a `\lean{MyPaper.X}` reference resolves |
| Manual import guessing | `lean_completions` | Auto-complete import paths |
| Checking axiom dependencies | `lean_verify` | Returns axioms used by a theorem + source scan |

### MCP-first stub generation

After generating a stub file:

1. **`lean_diagnostic_messages`** on the new file → catch type errors immediately
2. **`lean_file_outline`** → verify the declaration structure matches expectations
3. **`lean_hover_info`** on each imported symbol → confirm types resolve
4. **`lean_verify`** on completed proofs → check axiom soundness

## CRITICAL: Lean 4.24+ file structure — imports FIRST

Every generated `.lean` file **must** place `import` statements
before any other content, including module docstrings `/-! ... -/`.
Lean 4.24+ enforces this at parse time; violating it produces
`invalid 'import' command, it must be used in the beginning of the file`.

Correct order:
```lean
import Mathlib.CategoryTheory.Monoidal.Basic
import MyPaper.Basic

/-!
# MyPaper.MyModule
Description here.
-/

namespace MyPaper.MyModule
```

Wrong order (causes mass compile failures):
```lean
/-!
# MyPaper.MyModule         ← ERROR: doc block before imports
Description here.
-/

import Mathlib.CategoryTheory.Monoidal.Basic
import MyPaper.Basic
```

If you find existing files with wrong order, run a bulk import-order
repair script (e.g. `scripts/fix-lean-import-order.py`).

## Important: Generation is agent-only

The generation scripts below are **proof-writing tools**, not build steps.

- **Do not** run them as part of setup, session start, or routine builds.
- **Do not** run them before `lake build` — build compiles what exists.
- **Only** invoke them when the author requests new formalization work
  (new stubs, new extractions, new theorem statements).
- CI workflows run them automatically — that is CI-only behavior.

## Workflow

### 1. Extract proof objects from LaTeX (agent-only)

Parse all `chapters/*.tex` files for `\begin{theorem}`,
`\begin{definition}`, etc. and output `proof-objects.json`.

### 2. Generate Lean stubs (agent-only)

Read `proof-objects.json` and insert `sorry`-based stubs before the last
`end` statement in each `lean/MyPaper/*.lean` file to maintain namespace
structure.

### 3. Add LeanBlueprint macros to LaTeX

After generating stubs, annotate the LaTeX source with:

```latex
\begin{theorem}\label{thm:my-result}
  \lean{MyPaper.Chapter.my_result}
  \uses{def:prerequisite}
  Statement here.
\end{theorem}
```

Add `\leanok` once the Lean proof is complete (no `sorry`).

### 4. Update proof status after Lean build

```bash
cd lean && lake build 2>&1 | <update-proof-status script>
```

## Naming Conventions

| LaTeX label | Lean declaration |
|-------------|-----------------|
| `thm:lifting-exists` | `MyPaper.Foo.lifting_exists` |
| `def:quantum-connection` | `MyPaper.MainStructure.quantum_connection` |
| `lem:torsion-skew` | `MyPaper.Foo.torsion_skew` |
| `def:categorical-instanton` | `MyPaper.CategoricalInstanton` |
| `prop:categorical-dq-squared` | `MyPaper.categorical_dq_squared` |
| `def:categorical-jet` | `MyPaper.CategoricalJet` |

Rules:
- Hyphens become underscores
- The Lean namespace matches the chapter module
- Fully qualified name = `MyPaper.<Chapter>.<snake_case_name>`
- Categorical structures (type-level) use `CamelCase` (e.g., `CategoricalJet`)
- Categorical theorems/lemmas use `snake_case` (e.g., `categorical_self_duality`)
- Top-level categorical stubs live directly in the `MyPaper` namespace (not a chapter submodule)

## Base ring convention (STRICT — the project authoring conventions)

When generating Lean stubs, **always start over a generic type variable
`{R : Type*}`** with the weakest typeclass that admits the construction.
Only specialise to `ℝ` when the statement crosses the archimedean wall:
`Real.sqrt`, `Real.rpow`, `Real.cos`, `Real.exp`, `Real.log`, an ordering
predicate (`0 < q`), `linarith` / `positivity`, or an experimental /
external numerical literal.

```lean
-- ✓ GENERIC: stays over arbitrary Field
def qBracket {R : Type*} [Field R] (q : R) (n : ℕ) : R :=
  (q ^ n - q ^ (-(n : ℤ))) / (q - q⁻¹)

-- ✓ SPECIALISED: needs Real.sqrt → ℝ is mandatory
noncomputable def myRadical (q : ℝ) : ℝ :=
  Real.sqrt (q^4 + q^2 + 1) / (q^2 + 1)

-- ✗ DON'T do this — silently ℝ-specialises a generic identity
-- def qBracket (q : ℝ) (n : ℕ) : ℝ := …  -- WRONG
```

Authoring rule: **generic at point of creation is cheap to specialise
later (drop the parameter); ℝ-specialised code is hard to generalise
back** because downstream consumers accrete archimedean assumptions
silently. When in doubt, stay generic.

Concrete cheat-sheet — see `formalizer.md §Base ring convention` and
`the project authoring conventions` for the full table.

## Lean Project Structure

The repo is a **single root Lake workspace** (`/lakefile.toml`,
`/lean-toolchain`) that aggregates one Lake package per paper. A paper's
package lives at:

```
content/<paper>/lean/
├── lakefile.toml         ← per-paper Lake config (registered by root lakefile.toml)
├── MyPaper.lean          ← root module (library = MyPaper)
└── MyPaper/
    ├── Basic.lean        ← Shared foundations
    ├── MainStructure.lean ← Chapter 1
    ├── Elaboration.lean  ← Chapter 2
    └── ...               ← one per chapter
```

Other papers follow the same pattern under `content/<paper>/lean/`. The
package-name → directory registry lives in
`folio-assistant/schemas/lean-packages.ts`. Build from the repo root:

```bash
lake build           # build every paper
lake build MyPaper   # just one library
lake exe cache get   # Mathlib cache for the workspace
```

Do **not** create a top-level `lean/` directory — that layout is
deprecated.

## Linking to mathlib4

When a Lean declaration corresponds to an existing mathlib result:
1. Add it to the `mathlib_links` array in `proof-objects.json`
2. In the Lean file, import the relevant mathlib module
3. Use `mathlib_links` in the `lean` field of the proof object:

```json
{
  "lean": {
    "decl": "MyPaper.Foo.lifting_exists",
    "url": "https://<docs-site>/lean/MyPaper/Foo.html#MyPaper.Foo.lifting_exists",
    "mathlib_links": ["Mathlib.Topology.FiberBundle.Basic"]
  }
}
```

## Output Format

The `proof-objects.json` manifest follows the project schema.  Lean
declarations are referenced by their doc-gen4 URL — the Lean data model is
**not** duplicated in JSON.

## Blueprint Synchronization

When generating or updating Lean stubs, the following artifacts must stay
in sync — it is the **author's responsibility** to ensure consistency:

| Artifact | Must match |
|----------|-----------|
| `\label{thm:foo}` in `chapters/*.tex` | `\label{thm:foo}` in `blueprint/src/content.tex` |
| `\lean{MyPaper.Ch.foo}` in blueprint | Actual declaration name in `lean/MyPaper/Ch.lean` |
| `\uses{def:bar}` in blueprint | Existing `\label{def:bar}` in same file |
| `\leanok` in blueprint | Zero `sorry` in the linked Lean declaration |
| `-- Ref: [key]` before sorry | Citation key `key` in `content/schema/references.ts` |
| `\cite{key}` in blueprint | Citation key `key` in `content/schema/references.ts` |

### Blueprint update workflow

1. Add/modify a theorem in `chapters/*.tex` with `\label{}`
2. Run the extract + generate stubs pipeline
3. Add the matching entry to `blueprint/src/content.tex` with `\lean{}`
   and `\uses{}` edges
4. If the Lean proof is complete, add `\leanok`; otherwise leave it out
5. CI validates via `lake exe checkdecls blueprint/lean_decls`

## Content Object Integration

Content objects (`.ts` + `.md` + `.lean` triples) are the **authoritative
source**, not raw LaTeX. The Lean generation pipeline should be
content-object-aware:

### Block kind determines Lean requirements

| Block kind | Lean required? | Action |
|-----------|---------------|--------|
| `definition` | **Yes** (enforced by constraint rule) | Must generate `.lean` sibling |
| `theorem`, `lemma`, `proposition`, `corollary` | **Expected** | Should generate `.lean` sibling |
| `example`, `remark`, `conjecture` | Optional | Only if author requests |
| `prose`, `equation`, `diagram` | N/A | Skip |

### CRITICAL: `.lean` files are NEVER standalone

A `.lean` file MUST always be part of a content triple (`.ts` + `.md` +
`.lean`).  There is no valid scenario where a `.lean` file exists without
a corresponding `.ts` manifest.  The `.ts` manifest is the authoritative
record of the block's kind, label, lean declaration, status, and
dependency graph.  An orphan `.lean` file is always a bug.

### Content-object-aware stub generation

Instead of extracting from LaTeX, read the `.ts` manifest:

1. **Scan content objects**: find all blocks where `kind` requires Lean
2. **Check for existing `.lean` sibling**: skip if already exists
3. **Read the `.md` file**: extract the mathematical statement
4. **Generate the `.lean` sibling** alongside the `.ts` and `.md` files
5. **Update the `.ts` manifest**: set `lean.ref` to the package-qualified
   URI `"<pkg>:<Decl.Path>"` (per the project authoring conventions). The legacy
   `lean.decl` / `lean.file` shape is removed from the schema.

### The `uses[]` dependency graph

The `uses` field in content `.ts` manifests forms a dependency DAG.
**List only immediate neighbors** — transitive deps are derived by
walking the graph. Run `bun run pipeline/prune-transitive-deps.ts`
after edits.

- Generate stubs in topological order (walk the graph for full ordering)
- The Lean import graph should reflect the `uses[]` ordering
- When a definition changes, re-validate all blocks that `uses` it

### Naming: `.ts` label → Lean declaration

| `.ts` label | Lean declaration | `lean.ref` URI |
|-------------|-----------------|----------------|
| `def:main-universe` | `MyPaper.MainUniverse` | `"mypaper:MyPaper.MainUniverse"` |
| `thm:emergence` | `MyPaper.emergence` | `"mypaper:MyPaper.emergence"` |
| `prop:frobenius-relation` | `MyPaper.frobenius_relation` | `"mypaper:MyPaper.frobenius_relation"` |

The `lean.ref` field in the `.ts` manifest is the canonical mapping.
Parse with `parseLeanRef()` from
`folio-assistant/schemas/lean-packages.ts` to get
`{ package, decl, module, name }`.

## Checklist

- [ ] All content blocks requiring Lean have sibling `.lean` files
- [ ] Every block where `kind` requires Lean has a `lean.ref` URI
- [ ] Lean files compile without errors (sorry warnings are expected)
- [ ] `\lean{}` macros in LaTeX match the Lean declaration names exactly
- [ ] `\uses{}` macros capture all mathematical dependencies
- [ ] Every `sorry` has a preceding `-- Ref: [key] url` comment
- [ ] Every `-- Ref: [key]` key exists in `content/schema/references.ts`
- [ ] `blueprint/src/content.tex` mirrors all `\lean{}` macros from chapters
- [ ] `\leanok` only appears for sorry-free declarations

---

## Trivial-model consistency witness (conjecture-class companion)

Whenever a conjecture is axiomatised as a `class` (per AGENTS.md
§3b, the conditional-class exception), generate a paired
`def trivialModel … : TheClass … where …` populated with
`PUnit`/`0`/`fun _ => True` so that **every** class field reduces
to `rfl`.  This proves the class axiomatisation is **consistent**
(not vacuously inconsistent) without polluting typeclass
resolution — use `def`, never `instance`.

```lean
/-- **Trivial model (consistency witness).**

    Concrete `MyClass R q` with `NormalForm := PUnit`
    and the identity action.  Proves the class axiomatisation
    is consistent.  Provided as a `def` (not `instance`) so it does
    not pollute typeclass resolution. -/
-- Ref: [manuscript] chapter/section
def trivialModel (R : Type u) [CommRing R] (q : R) :
    MyClass R q where
  NormalForm := PUnit
  action _ T := T
  quadratic := True
  property_holds T := ⟨0, T, rfl⟩
```

### Generation rule

When generating a conjecture class, emit two `def`s in the same file:

1. The `class` itself (with `nStar_eq` / `field_eq` style).
2. A `trivialModel` populated entirely with degenerate values so
   each class field discharges by `rfl`.

The trivial model unblocks downstream `[ClassName]`-conditional
theorems (the project authoring conventions-cond) by guaranteeing the conditional
hypothesis is satisfiable, hence the conditional results are not
vacuously true.

### Anti-pattern

Do **not** mark the trivial model as `instance` — typeclass search
would then prefer the trivial model over any future genuine
instance, silently collapsing all downstream theorems to the
degenerate model.  Always `def trivialModel … : TheClass`.
{% endraw %}
