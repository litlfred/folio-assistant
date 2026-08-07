---
layout: default
title: Semantic review scoping
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-paper-adapter/semantic-review-scoping.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-paper-adapter/semantic-review-scoping.md) — do not edit here.

{% raw %}
# Semantic review scoping

## The problem this solves

The expensive QA criteria are the ones a machine cannot settle —
`proof-narrative-lean-equiv`, `proof-statement-integrity`, the vacuity
family, the `proof-rater-*` scores. Every one is `automated: false`, so
every one costs agent turns. A sweep that walks the corpus in file order
spends most of them on blocks that cannot affect anything anyone cares
about.

## Use it

```sh
bun run content/pipeline/semantic-cone.ts --targets thm:a,thm:b
bun run content/pipeline/semantic-cone.ts --targets thm:a --coverage
```

`--coverage` is the useful one: it lists cone members that lack a
**fresh** adjudication of each agent-checked criterion. That turns "have
we reviewed enough?" from a judgement call into a computed answer.

## Why it works: type edges only

Semantic correctness — does the formalisation encode the intended
mathematics? — propagates differently from logical dependency:

- If `T`'s **statement** is phrased in terms of `D`, and `D` encodes the
  wrong notion, then `T` claims something other than intended, however
  impeccable its proof. Risk propagates.
- If `T`'s **proof** merely invokes lemma `L`, the kernel has already
  checked that `T` follows from `L`. Whether `L` *means* what its author
  intended cannot change what `T` claims. Risk stops.

So the cone is the transitive closure over **type edges only**, and that
termination is the entire reduction.

## Read the confidence line — it is not decoration

| Output | Meaning |
|---|---|
| `confidence: atlas` | Elaborated split. Trust the cone. |
| `confidence: scan` | Lexical guess. A missed type edge **shrinks** the cone — the dangerous direction. Ordering only. |
| `confidence: editorial-only` | No formal graph. This is the `uses[]` reading cone, a **different question**. |
| `NO EDGES TRAVERSED` | The cone is just its targets. That is **missing data**, not a 99% reduction. |

**Never present a `scan` or `editorial-only` cone as evidence that
review is complete.** Use it to decide what to review *first*. Only an
`atlas` cone supports a completeness claim, which is why
`proof-semantic-cone-reviewed` is not yet a registered criterion.

## Workflow

1. Name the targets — the headline theorems the paper is *for*. If you
   cannot name them, that is worth surfacing before spending review
   budget.
2. Run with `--coverage`.
3. Work the list top-down; it is sorted by how many criteria are missing.
4. Re-run after adjudicating. Entries go fresh as sidecars are written.

Note that `--coverage` reuses the sidecar freshness contract, so a block
edited since its last review reads as unreviewed — and thanks to
statement-granularity, a pure proof rewrite does **not** re-open the
statement-level criteria.

## Interaction with other skills

| Skill | Interaction |
|---|---|
| `lean-formal-graph` | Supplies the type edges; check `formalSource` first |
| `integration-backlog` | Use the cone to order dispatch instead of corpus order |
| `proof-triage` | Cone membership is a triage input alongside complexity |
| `lean-proof-vacuity-audit`, `lean-proof-review` | The adjudicators this rations |
| `delivery-summary` | Report coverage against headline theorems, not raw block counts |
{% endraw %}
