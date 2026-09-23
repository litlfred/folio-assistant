---
layout: default
title: 'proof-verification'
parent: Skill instructions
---

{: .note }
> Generated from [`skills/authoring-math/proof-verification.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/authoring-math/proof-verification.md) — do not edit here. Typed contract: [schema reference](../skills/proof-verification.html).
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/authoring-math/proof-verification.md){: .fa-edit-source }

{% raw %}
# proof-verification

> Skill id: `proof-verification` · Package: `authoring-math` ·
> Named by `authoring-a-paper.bpmn` step **5 · Formalise in Lean**, in the
> `Lean toolchain (lean-mcp)` lane.

Decide, and record, whether a block's formal claim is actually verified —
separately from whether it builds.

**Entry point, not the manual.** `folio-paper-adapter` carries the skills that
do each check; this says which question each one answers and which answers are
allowed to count as "verified".

## The three states, and why the third is the point

| state | means | evidenced by |
|---|---|---|
| **verified** | Lean accepts it, it is non-vacuous, and the Lean claim matches the prose | `lean-proof-review` + `lean-proof-vacuity-audit` + `proof-narrative-lean-equivalence` |
| **open** | there is a declaration, and at least one annotated `sorry` | `proof-gap-audit`, `proof-triage` |
| **could not determine** | the toolchain did not run, or the cache was cold, or the build died before any declaration elaborated | `lean-environment-setup` |

**The third is never written as either of the other two.** A build that did not
run is not a failed proof, and it is emphatically not a passed one. This is the
same rule the QA sweep, the CI-health report and the README sections all follow
here, and it is the one most often broken under time pressure: an agent that
cannot build reports "no errors".

## What a green build does not tell you

`lake build` answers one question — does this elaborate. It does not answer:

- **Is the statement inhabited?** `lean-witness-audit`.
- **Is it vacuous?** `lean-proof-vacuity-audit`. A theorem whose hypotheses
  cannot be satisfied is true and says nothing.
- **Does it match the prose?** `proof-narrative-lean-equivalence`. This is the
  most common real defect: the Lean is a weaker claim, quantified differently,
  or over a different structure than the paragraph beside it.
- **Is the proof substantive?** `lean-substantive-pass`, and
  `proof-conciseness` for the opposite failure.

A block that passes the build and fails any of these is **not** verified, and
recording it as such is worse than recording it open — an open claim gets
worked, a falsely-verified one gets built upon.

## Recording it

`proof-status-tracking` owns the sidecar and its shape. Two rules from it worth
repeating because they are what makes the record trustworthy:

- The status is written by the sweep, **never hand-edited**. A hand-edited
  status is an assertion wearing a measurement's clothes.
- Every `sorry` carries the proof obligation it stands for
  (`skills/requirements/lean-verification.json`, SHALL). An unannotated `sorry`
  cannot be told from abandonment.

## Where this sits in the process

`authoring-a-paper.bpmn` puts formalisation in the `Lean toolchain (lean-mcp)`
lane, which is a **system** lane: it runs a fixed toolchain and exercises no
judgement. Deciding that a mismatch between prose and Lean is acceptable is not
the toolchain's call — it belongs to the editor, at
`editing-hci-validation.bpmn`'s `Task_ReviewFindings`, which is marked
`relaxable="false"` precisely so that no policy can route around it.
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [Authoring a paper](../../processes/authoring-a-paper.html) | 5 · Formalise in Lean |

