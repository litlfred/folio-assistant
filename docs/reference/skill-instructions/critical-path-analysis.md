---
layout: default
title: Critical Path Analysis & Context Review
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-paper-adapter/critical-path-analysis.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-paper-adapter/critical-path-analysis.md) — do not edit here.

{% raw %}
# Critical Path Analysis & Context Review

## Overview

This skill traces the logical dependency chain of the paper from axioms
to final results, classifying every block on the critical path by its
**context assumptions**:

- **GENERAL**: Statement and proof work at the most general level, under
  the weakest assumptions — only the project's axioms / the general
  theory's axioms.
- **SPECIALIZED STATEMENT**: The statement itself requires a particular
  realisation, model, or extra structure that the general theory does
  not assume.
- **SPECIALIZED PROOF**: The statement is general, but the proof uses
  tools only available under stronger assumptions (a concrete model,
  analytic or geometric machinery, a specific group/space, numerical or
  empirical data, etc.).
- **MIXED**: Some parts general, some specialised.

## When to Use This Skill

- "What assumptions does this result actually need?"
- "Is this proof general or does it rely on a specialisation?"
- "Which results need rewriting for the general case?"
- "Trace the critical path from X to Y"
- "Audit specialisation dependencies"
- "What's the minimal assumption set for theorem Z?"
- "Separate the general core from the specialisation"

## Workflow

### 1. Identify the critical path

Read the paper manifest and chapter manifests to trace the dependency
chain via `uses[]` fields.  Build the DAG from the target result back
to the axioms.

### 2. Classify each block

For each block on the critical path, read both the `.md` (narrative)
and `.ts` (manifest) files.  Classify by:

| Signal | Likely classification |
|--------|----------------------|
| Uses only the abstract/foundational vocabulary of the general theory | GENERAL |
| Invokes a concrete model, realisation, or extra structure not assumed by the general theory | SPECIALIZED |
| Pulls in analytic/geometric machinery, a specific group or space, or numerical/empirical data | SPECIALIZED |
| Relies only on the foundational constructions defined by the project's axioms | GENERAL |

### 3. Identify mismatches

Flag blocks where:
- Statement is general but proof is specialised → candidate for a
  general proof rewrite
- Statement mixes general and specialised language → candidate for
  splitting into two blocks
- Proof uses heavier machinery when the general argument suffices

### 4. Propose actions

For each flagged block, propose one of:
- **Rewrite proof** at the general level (when the general argument exists)
- **Split statement** into a general theorem + specialised corollary
- **Move to specialisation section** (keep content, reorganise placement)
- **Add dual proofs** (general + specialised via `proofs[]` array)
- **Accept as specialised** (when no general alternative exists)

### 5. Architectural conventions

The paper follows a **general core + specialisation** architecture:

- General results (GENERAL) live in the main sections of each chapter.
- Specialisations live in a dedicated section.
- A suffix on a block name denotes a specialisation variant
  (e.g. a `-C` suffix marking the specialised form of a general block).
- Statements that have both a general and a specialised proof list
  both in the `proofs[]` array of the `.ts` manifest.
- The general proof is listed first; the specialised proof second.

### 6. The specialisation boundary

A critical path typically flows from foundational definitions through
intermediate results to a target theorem, crossing a **specialisation
boundary** below which blocks require a concrete realisation:

```
def:foundation          (the project's axioms)
  → def:core-structure  (general construction)
  → thm:main            (general statement + general proof)
  ──── SPECIALISATION BOUNDARY ────
  → cor:specialized-X    (applies the general result to a concrete model)
  → ...                  (machinery available only under the specialisation)
```

Everything above the boundary is general; everything below requires a
particular realisation.

## Audit checklist

When auditing a critical path, check every object for:

1. **Lean completeness**: .lean file exists? sorry count? status accurate?
2. **Worked-example pair**: `*-example.ts`/`.md` pair exists? Listed in `examples[]`?
3. **Logical consistency**: `uses[]` matches actual .md cross-references?
4. **Notational consistency**: per the project's conventions.
5. **Context classification**: GENERAL vs SPECIALIZED — flag mismatches
6. **Cross-references**: all `(#label)` links resolve to existing blocks?

## Output format

Produce a table with columns:
| Block | Classification | Specialisation signals | Action needed |

Follow with specific recommendations, using AskUserQuestion for
mathematical strategy decisions (with structured options, not
free-text questions).
{% endraw %}
