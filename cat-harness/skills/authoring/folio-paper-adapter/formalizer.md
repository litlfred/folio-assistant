---
name: formalizer
description: >
  Lean 4 Formalizer — translates the logical skeleton of narrative mathematical
  proofs into Lean 4 tactic blocks.  Uses the Ontologist's glossary to resolve
  types, maps narrative proof phrases to Lean tactics, and generates sorry-bridged
  partial proofs that compile.
allowed-tools: Read Write Edit Bash Grep Glob
---

# Lean 4 Formalizer (Narrative to Proof)

## Heavy-proof discipline (MANDATORY)

When formalising a content block, **every Lean theorem you add MUST
have a matching `**Proof.**` narrative block in the sibling `.md`
file**. The narrative proof is not optional — it is the
authoritative human-readable form of the result.

Required structure in the `.md` for every Lean theorem `foo`:

```markdown
**Proposition (Lean: `foo`).** Statement of the theorem.
*Proof.* Brief narrative — one paragraph for typical algebraic
identities, two or three for inductive or case-analysis proofs.
Cite the Mathlib lemmas / structural moves used so a reader can
follow the Lean proof line-by-line. End with $\square$ or □.
```

The narrative proof should:

- State the theorem in math notation (not Lean syntax) + name the
  Lean theorem with `(Lean: \`name\`)` so navigation is explicit.
- Sketch the key idea in 1–3 sentences for trivial / algebraic
  cases; expand for inductions / case-splits.
- Cite the structural moves: Mathlib lemma names, induction
  variable, key field identities (`field_simp`, `ring`, etc.).
- Match the Lean proof's structure — if the Lean uses induction
  on `n`, the narrative explains the base case + step.

**Anti-pattern**: writing a Lean theorem with no `.md` counterpart,
or with only a one-line "see Lean" stub. Both leave the paper
narrative incomplete and force readers to read Lean to understand
the math. The `.md` must stand on its own as a math reading.

When generating Lean theorems, ALWAYS edit the `.md` in the same
diff to add the narrative proof. Don't split into separate
commits — Lean and narrative must move together.

## Overview

This skill translates the **logical skeleton** of the paper into Lean 4
tactic blocks.  It depends on the Ontologist skill having already produced
a resolved glossary — every term used in theorems must have a unique type
assignment before formalization can proceed.

### Pre-flight: rebase + lean-ref migration

Before authoring or editing `.lean` siblings, the working branch must
be on the current `lean.ref` URI shape.  If the branch was rebased
or merged from upstream, run the idempotent migration **first**:

```bash
cd content && bun run migrate-lean-refs
```

When authoring the `.ts` manifest for a new block, set
`lean: { ref: "<pkg>:<Decl>" }` (never the legacy `decl:` / `file:`
shape).  Use `<pkg>` from `LEAN_PACKAGES` in
`folio-assistant/schemas/lean-packages.ts`.  See the project authoring conventions for the
URI grammar and §0b for the rebase workflow.

## When to Use This Skill

- After the Ontologist has produced `glossary.json` and `Glossary.lean`
- When translating theorem statements from LaTeX to Lean
- When filling `sorry` placeholders with actual proofs
- When `lake build` succeeds but there are remaining `sorry` warnings

## Lean MCP Tools (paper-assistant)

When the MCP server is available, **prefer MCP tools over shell commands**:

| Old workflow | MCP tool | Why better |
|-------------|----------|-----------|
| `lake build` + parse output | `lean_diagnostic_messages` | Structured errors per file, no parsing |
| Export proof state via script | `lean_goal` | Live goal state at any line/column, no scripting |
| Grepping Mathlib for lemmas | `lean_leansearch` / `lean_loogle` | Natural language + type-signature search across all of Mathlib |
| Guessing tactics one at a time | `lean_multi_attempt` | Try multiple tactics at a sorry position in one call |
| Manual `exact?` / `apply?` | `lean_completions` | Auto-complete with context-aware suggestions |
| Reading Mathlib source for docs | `lean_hover_info` | Hover docs for any symbol inline |
| Manual `Try this` checking | `lean_code_actions` | Get resolved edits from "Try This" suggestions |

### MCP-first tactic workflow

When filling a `sorry`:

1. **`lean_goal`** at the sorry position → read the goal state
2. **`lean_multi_attempt`** with candidate tactics from the tactic table → try all at once
3. If no tactic works, **`lean_leansearch`** with the goal in natural language
4. If leansearch finds a close match, **`lean_loogle`** with the type signature
5. **`lean_code_actions`** on the line → check for "Try This" suggestions
6. After editing, **`lean_diagnostic_messages`** → verify no new errors

### MCP-enhanced library synthesis

Instead of a script for import synthesis:
1. Write the theorem stub with a `sorry` body
2. **`lean_diagnostic_messages`** → see "unknown identifier" errors
3. **`lean_leansearch`** for each unknown identifier → find the right import
4. **`lean_completions`** at the import line → auto-complete module paths

## Important: Generation is agent-only

The scripts below are **proof-writing tools**. They create or modify Lean
files. They must only be run when the author has requested formalization.

- **Do not** run them during setup, session start, or routine builds.
- **`lake build`** = compile-only. Never precede it with generation scripts.
- CI workflows run them automatically — that is CI-only behavior.

## Workflow (invoke only on author request)

### 1. Library synthesis

The Formalizer identifies required Mathlib imports from the glossary
(reads `glossary.json` and produces the import block for each chapter
file). Prefer the MCP-driven flow above; a project may also wire a
generation script for this step.

### 2. Generate theorem stubs

Create Lean theorem declarations with `sorry` bodies, using the glossary
types for the statement signatures.

**Witnessed values in narrative.**  Whenever the narrative statement
of a theorem, lemma, proposition, conjecture, corollary, or its proof
quotes a computation-derived numerical literal, the **`.md`
narrative** must use the `:val[name]` directive — not a hard-coded
number — so the rendered statement tracks the canonical witness JSON.
The `.lean` file is unaffected (Lean uses its own numerical
constants); the rule is about the LaTeX render of the narrative
sibling.

### 3. Tactic translation

The Formalizer maps narrative proof phrases to Lean tactics:

| Narrative Phrase                    | Primary Tactic          | Fallbacks                       |
|-------------------------------------|-------------------------|---------------------------------|
| "By calculation"                    | `ring`                  | `field_simp`, `polyrith`        |
| "Clearly follows from..."          | `aesop`                 | `linarith`, `omega`             |
| "By induction on n..."             | `induction n with`      | `cases n`                       |
| "By the universal property of..."  | `Limits.IsLimit.lift`   | `Limits.IsLimit.hom_ext`        |
| "Diagram commutes" / "naturality"  | `aesop_cat`             | `slice_lhs`, `slice_rhs`        |
| "By contradiction"                 | `by_contra`             | `exfalso`                       |
| "By definition"                    | `rfl`                   | `unfold`, `simp only`           |

### 4. The "Sorry" Bridge

When a narrative step is too complex for immediate formalization:

1. Extract the logical structure of the proof
2. Create a `lemma` for each non-trivial step
3. Fill each lemma body with `sorry`
4. **Add a `-- Ref: [key] url` comment** before each `sorry` linking
   to the foundational reference that would resolve the gap
5. Ensure the file remains syntactically correct
6. Use direct grep for sorry counts rather than trusting any generated
   `proof-objects.json` artefact — extractors that read generated
   LaTeX artefacts can silently produce 0 objects.

```lean
/-- Intermediate step: a sub-result of the main theorem.
    TODO: formalize using the cited structure. -/
lemma my_substep (A : MyStructure) :
    MyHypothesis A → MyConclusion A := by
  -- Ref: [author2004] https://doi.org/10.xxxx/xxxxx
  sorry
```

**Rule**: Every `sorry` must have a `-- Ref:` annotation.  The `key`
must match a citation key in `content/schema/references.ts` exactly (case-sensitive).
(`references.bib` is auto-generated from this file — never edit `.bib` directly.)  If no
published reference exists, use `[manuscript]` and cite the chapter/section.
This is enforced by the axiom report's Theoretical Gap Report.

**Conditional-class carve-out.** Class-body sorries are NOT missing
proofs — they are conjectural inputs per the project authoring conventions-cond, permanent
by design. Before adding a `-- Ref:` to a `sorry`, check whether you are
inside a `class` body — if yes, the `sorry` is the conjectural
axiomatisation and no external citation is required (the conjecture
itself IS the reference). Only `theorem | lemma | def | instance` body
sorries need `-- Ref:`. Maintain a catalogue of class-body sorries so a
sweep can distinguish them from missing proofs (correct the `\bsorry\b`
regex to `\bsorry\b(?!-)` so the docstring phrase `sorry-free` is not
counted).


## Where each section lives

This skill was 842 lines. An agent reads it before acting, every time, and at
that length it skims — so the detail sits beside it, grouped by *when you need
it*. Nothing was deleted.

| what | where |
|---|---|
| heavy-proof discipline, overview, when to use, MCP tools, workflow, checklist | **here** — read first, every time |
| base ring convention, imports, library synthesis | [`formalizer/conventions.md`](formalizer/conventions.md) — before writing a declaration |
| proven patterns, tactic ladder, authoring patterns, simplification pass | [`formalizer/patterns.md`](formalizer/patterns.md) — while proving |
| proof-state export, output structure, dependencies, blueprint, content objects | [`formalizer/integration.md`](formalizer/integration.md) — when wiring a finished proof in |

The **heavy-proof discipline** below is MANDATORY and stays here deliberately:
it governs whether you should be formalising at all, and moving it behind a
link would put the gate after the work.

## Checklist

- [ ] All theorem statements match the `.md` narrative originals
- [ ] Import blocks are minimal and correct
- [ ] Every `sorry` has a `-- Ref: [key] url` comment (citation-linked)
- [ ] All `-- Ref:` keys exist in `content/schema/references.ts`
- [ ] `lake build` succeeds (sorry warnings are expected)
- [ ] Tactic choices match the narrative proof strategy
- [ ] Proof state can be exported at every sorry site
- [ ] `blueprint/src/content.tex` entries match Lean declarations
- [ ] `\leanok` only on sorry-free declarations

---

