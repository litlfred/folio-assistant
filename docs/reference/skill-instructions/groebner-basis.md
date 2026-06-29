---
layout: default
title: Gröbner Basis
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-paper-adapter/groebner-basis.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-paper-adapter/groebner-basis.md) — do not edit here.

{% raw %}
# Gröbner Basis Skill

## Role

Compute Gröbner bases and normal forms for the project's algebraic
structures (commutative or non-commutative), and apply the reduction to
the project's words/elements to extract the invariants the project
needs. The deliverable is always a **reproducible witness**: the reduced
normal form plus a step-by-step log of which relation fired at each step.

## When to Use

- "reduce word" / "Gröbner reduce" / "normal form"
- "compute element" / "trace / invariant from reduction"
- "Gröbner basis for …" / "division algorithm"
- "CAS computation" / "letterplace"

## Tools

### CAS (exact, symbolic)

For exact symbolic computation over the base ring. Fastest for large
inputs. For a non-commutative algebra, a letterplace CAS encodes
positioned generators and provides the core operations: build the
letterplace ring with a degree bound; multiply with position shifting;
compute the two-sided Gröbner basis of the defining ideal; reduce an
element to normal form modulo that basis. Record the ring, the relations
of the ideal, and the monomial ordering used.

### Instrumented project routine (step-logged)

A project routine performs the same reduction with **step-by-step
logging** — which relation fired, and any cost/weight change it
incurred. Use it when you need the reduction *trace*, not just the
answer. It exposes: build-and-reduce of the input element, the reduction
itself (with logging), the invariant extraction, and a full-computation
entry point that emits a witness.

## The Gröbner basis

For the project's algebra, the Gröbner basis `G` consists of the
defining relations of the ideal, expressed in the project's monomial
ordering. Classify each relation by whether it changes the project's
tracked cost/weight (the "energy-changing" relations) or preserves it
(reordering / topological-invariance relations). The admissible system
`(B, <)` uses the project's chosen monomials and ordering.

## Proven results to track

Record the structural results the project relies on (each with a witness
and/or formal cross-reference), e.g.: a factorization of the extracted
invariant; path-independence of the cost under reduction (a diamond
-lemma / confluence statement); which relations change cost; and the
complexity of the decomposition.

## Witness files

All computations produce witness JSON next to the script, named per the
project's witness convention (`<computation>.witness.json`), including a
CAS-backed variant when a CAS is available.

## Cross-references

Link each result to its formal/blueprint counterpart: the admissible
system and division algorithm; the unique-normal-form proposition; the
cost-as-invariant theorem; the factorization theorem; and the
complexity proposition. Keep these cross-references in the project's
content tree.
{% endraw %}
