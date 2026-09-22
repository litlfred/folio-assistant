---
layout: default
title: 'lean-formalization'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/authoring-math/lean-formalization.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/authoring-math/lean-formalization.md) — do not edit here. Typed contract: [schema reference](../skills/lean-formalization.html).
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/authoring-math/lean-formalization.md){: .fa-edit-source }

{% raw %}
# lean-formalization

> Skill id: `lean-formalization` · Package: `authoring-math` ·
> Named by `authoring-a-paper.bpmn` step **5 · Formalise in Lean**, in the
> `Lean toolchain (lean-mcp)` lane.

Take a block whose assertion is a formal mathematical claim and give it a
`.lean` sibling that Lean 4 accepts.

**This skill is the entry point, not the manual.** The formalisation work
itself is covered in depth by `folio-paper-adapter`, which carries seventeen
Lean skills and twelve proof skills. Fetching this one and stopping is the
mistake it exists to prevent: it tells you which of those to open and in what
order, and nothing here restates what they say.

## When this applies at all

Only in a **paper** folio. The seven block kinds whose assertion is formal —
`definition`, `theorem`, `lemma`, `proposition`, `corollary`, `conjecture`,
`proof` — are the paper profile, and `content_profile_check` refuses them in a
document folio on every `content_validate`. If you are reaching for this skill
in a document folio, read `folio-document-adapter/normative-statements` first:
what you probably want is a labelled `prose` block, not a theorem.

`definition` **requires** `lean`. The rest expect it. `example`, `remark`,
`algorithm` and `simulator` declare an optional `lean` field that the paper
profile permits and the document profile forbids.

## The order to work in

| step | skill | why it is first |
|---|---|---|
| 0 | `lean-environment-setup` | A formalisation attempt against a toolchain that will not build is not a measurement of anything. |
| 0b | `lean-cache-restore` | Restore the Mathlib cache before building, or pay tens of minutes for what a download gives you in one. |
| 1 | `lean-generation` | Produce the declaration. This is the skill that actually writes Lean. |
| 2 | `lean-build-fix` | When `lake build` fails, work the error rather than rewriting the statement to make it compile. |
| 3 | `lean-proof-review` | Does the Lean say what the prose says? A green build does not answer this. |
| 4 | `proof-verification` | Record the status honestly — see that skill for what counts as done. |

## The failure this skill exists to name

**A compiling declaration is not a formalised claim.** The two ways it goes
wrong are both invisible to `lake build`:

- **Vacuity** — the statement is true because its hypotheses are unsatisfiable,
  so it asserts nothing. `lean-proof-vacuity-audit` is the check.
- **Drift** — the Lean statement is a weaker or different claim than the prose
  it sits beside. `proof-narrative-lean-equivalence` is the check, and
  `lean-witness-audit` is how you evidence that a declaration is inhabited.

Neither is caught by the build, and both produce a block that looks finished.
Run them before you call a block formalised.

## `uses[]` is editorial and must not come from Lean

The block's `uses[]` is what a **reader** must have read to follow the block.
The formal dependency graph is machine-derived from `lean.ref` and is a
different graph — the two diverge legitimately in both directions, because a
proof invokes `simp` lemmas nobody reads about, and a theorem is motivated by
an example it never cites.

**Never populate `uses[]` from Lean.** It destroys the signal every ordering
metric in the corpus is computed from. `lean-formal-graph` is how you look at
the formal side; `content-graph` is how you ask impact questions across both.

## `sorry`

`skills/requirements/lean-verification.json` states it as a SHALL: every
`sorry` carries a reference to the proof obligation it stands for. An
unannotated `sorry` is indistinguishable from an abandoned one. `proof-triage`
and `proof-gap-audit` are how you work the backlog of them down.
{% endraw %}
