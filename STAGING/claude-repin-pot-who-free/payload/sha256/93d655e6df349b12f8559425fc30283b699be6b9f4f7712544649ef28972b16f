---
input: schemas/skills/lean-formalization/input.schema.json
output: schemas/skills/lean-formalization/output.schema.json
---

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

## Adopted methods for formalising, and where they live

Three external methods for Lean formalization are adopted as methodology
nodes in the science layer, `folio-assistant-sci/methodologies/`, each citing a
paper held in `folio-assistant-sci/library/`. They are the *method*; the skills
above are how this platform performs it. Read the node when the question is
the one it names:

| node | read it when |
|---|---|
| `blueprint-driven-formalization` | deciding who writes dependency and completion status, and splitting a target into nodes a prover can attempt one at a time |
| `process-driven-autoformalization` | testing a candidate Lean statement (compile it WITH a proof — a one-sided filter, never evidence of faithfulness), or generating prose from Lean |
| `bidirectional-agentic-autoformalization` | organising an agent run over a whole paper, and reviewing the output by informalizing it back without the source |

Each node states what its paper measured and did not, and what this platform
refuses from it. The refusal most likely to be breached: **running out of
attempts is never a reason to write an `axiom`** (see `sorry` below).

## `sorry`

`skills/requirements/lean-verification.json` states it as a SHALL: every
`sorry` carries a reference to the proof obligation it stands for. An
unannotated `sorry` is indistinguishable from an abandoned one. `proof-triage`
and `proof-gap-audit` are how you work the backlog of them down.
