---
$schema: folio-methodology/v1
name: bidirectional-agentic-autoformalization
title: Bidirectional agentic autoformalization — extract, compile-fix, check faithfulness, then informalize back without the source
origin: >
  Yuanjie Ren, Jinzheng Li and Yidi Qi, "MerLean: An Agentic Framework for
  Autoformalization in Quantum Computation" (arXiv:2602.16554v1 [cs.LO],
  Massachusetts Institute of Technology and Northeastern University, 18
  February 2026). Open access.

  A SYSTEM paper: it reports one agent pipeline run on three quantum-computing
  papers. What is adopted below is the method; several of its steps are
  REFUSED here, and §"Refusals" says which and why.
evidence:
  - library/arxiv-2602.16554v1
applies-when: >
  **A whole paper, not a single theorem, is being formalised with an agent
  doing the Lean**, and the question is how to organise the run: what to
  extract first, how the compile-fix loop is bounded, what happens to a
  statement the agent cannot prove, and how a mathematician who does not read
  Lean reviews what came out.

  Do NOT use it to decide that a formalisation is faithful because the
  pipeline's own faithfulness step said so (see §3 and §"Refusals"). Not for
  choosing an axiom policy — this platform already has one, and it is stricter.
---

# Bidirectional agentic autoformalization

Two pipelines (§3): **autoformalization** — LaTeX paper → Lean 4 library on
Mathlib — and **autoinformalization** — the verified Lean → human-readable
LaTeX, for review. The pairing is the method; the paper's argument for it is
that compilation proves the code is *correct* and only a reading can show it is
*about the right thing*.

## 1 — Extract every statement first, as data, with its dependencies

Before any Lean is written the agent extracts every definition, theorem,
lemma, proposition, corollary and remark into structured records: an id, the
statement, **explicit dependencies on other statements**, and the proof sketch
where there is one (§3.1). The extraction is run several times, each pass
refining the last — expanding "by standard arguments" into steps, adding
missing intermediate lemmas, and **ordering statements so dependencies precede
dependents**.

This is the blueprint of `blueprint-driven-formalization`, built from the prose
before the Lean exists rather than inferred from Lean after. The two are
complementary: this one is the plan, that one is the record of what the plan
became.

## 2 — A bounded compile-fix loop, with language-server tools

Per statement: generate declarations, compile, parse the errors, repair,
repeat — until it compiles **without errors and warnings** or an attempt cap is
reached (§3.1; the cap was 30, Figure 2). The agent may inspect goals and
hover information through a language-server bridge, search Mathlib
semantically, and grep Mathlib's source to confirm a lemma exists before
citing it.

The paper's account of where the loop spends its attempts (§4.2), reported as
its observation: dependent-type arithmetic (e.g. `i - 1 + 1 = i` at the type
level), missing lemmas needing workarounds, and tactic timeouts forcing a
proof to be restructured. And the agent **introduces helper lemmas the paper
left implicit** — which is exactly where a reader of the output should look
hardest, since a helper lemma is a statement nobody wrote down beforehand.

## 3 — A faithfulness check after the build

*"Compilation alone is insufficient: an LLM can produce code that type-checks
but misrepresents the mathematics (e.g., proving a trivial statement instead of
the intended theorem)"* (§3.1). After a successful build the agent reflects on
whether the result matches the original meaning, and retries if not.

**The same agent that wrote the Lean judges it.** The paper does not report how
often this step rejected anything, nor any measurement of its accuracy. It is
adopted here as a *step in the loop* — ask the question before moving on — and
not as evidence: see §"Refusals".

## 4 — Informalize back, WITHOUT the source

The verified library is translated back to LaTeX: a `leanblueprint`-compatible
dependency blueprint and a textbook-style narrative (§3.2). The load-bearing
detail: **"no original statement or paper content is provided to the
informalization agent"**. The informalization is therefore a reading of the
Lean alone, and comparing it with the paper is a genuine two-sided comparison
rather than the agent recognising its own input.

Every axiom is highlighted in the output, so a reviewer sees at once which
results rest on unproved assumptions.

The paper's one report of this paying off (§5.2): in its unpublished test
paper, one lemma kept needing an axiom; the blueprint showed the cause was a
definition missing a constraint the author had assumed implicitly; fixing the
LaTeX let the formalisation complete. **One instance**, reported by the authors
of the tool — it shows the mechanism can surface an under-specified definition
in the source, and nothing about how often.

## What the paper measured, and what it did not

**These are the paper's findings, reported as such.** None is a mathematical
claim and none was reproduced here.

- Three papers, one domain (theoretical quantum computing): 114 statements,
  2,050 declarations, about 41,000 lines, under 42 hours of wall-clock time
  (Tables 1–2). One of the three is unpublished, which the authors offer as a
  guard against training-data contamination.
- 9.1% of the statements of one paper required axioms (§4.1).
- **Not measured:** any independent audit of faithfulness; any baseline;
  anything outside the one domain, which the authors themselves say "benefits
  from mature Mathlib support" (§6). "End-to-end formalization" in the paper
  means every statement ended compiled, with axioms where Mathlib lacked the
  machinery or the loop gave out — not that every statement was proved.
- The paper describes the run as "without human-in-the-loop intervention"
  (§2) and also says the result was "supported by manual review to ensure all
  new definitions and axioms are mathematically accurate" (§4.1). Both are
  true at once only if the review happened after the run; the paper does not
  say what the review found or changed.

## Two findings from reading the paper's own examples

Stated because the owner of this platform is a mathematician and these are the
checks this platform exists to make. **They are this node's reading of the
appendix, not claims the authors make.**

**The showcase theorem assumes its hard step.** Appendix A.1 presents
`FaultToleranceTheorem` as the formalisation of the source's Theorem 2, whose
hypotheses are a Cheeger constant `h(G) ≥ 1` and enough measurement rounds.
The Lean statement instead takes, as hypotheses, (a) that **every** spacetime
logical fault falls into a `LowerBoundCase`, and (b) that a fault of weight
exactly `d` **exists**. The conclusion `d_ST = d` then follows by a two-line
upper/lower bound. The source's conditions appear in the docstring and
configuration; whether they imply (a) and (b) is precisely the content of the
source's theorem, and in this statement it is assumed. That is `Class C —
Hypothesis drift` in `proof-narrative-lean-equivalence`: a Lean statement
stronger in its hypotheses than the paper, provable for that reason.

**Some axioms are elementary.** Appendix A.3 axiomatizes, among others, that
the tensor product of two cycles is a cycle and that a boundary tensored with a
cycle is a boundary — each a one-line consequence of the Leibniz rule
`d(z ⊗ w) = dz ⊗ w ± z ⊗ dw`, which the axioms' own docstrings state. The
paper's reason is that Mathlib's total-complex API was hard to unfold, which
is an engineering obstacle, not a mathematical one. The paper's own guidance
(§5.1) is that axioms "should not be too elementary". These fall under
`proof-no-provable-axiom` in `lean-proof-vacuity-audit`, tier **provable**.

## Refusals

- **No automatic axiom phase.** The paper converts a subgoal to an `axiom` when
  the attempt cap is reached. Here, an unproved obligation stays a `sorry`
  carrying `-- Ref:` to the obligation it stands for
  (`skills/requirements/lean-verification.json`); an `axiom` is admissible
  only for a genuine, cited external result, and an uncited or provable one is
  a finding (`lean-proof-vacuity-audit` §6). Running out of attempts is a fact
  about the loop, not a property of the mathematics, and an axiom records it as
  the latter. The paper's own distinction — an intentional assumption is not an
  incomplete proof — is right, and this platform already draws it with `-- Ref:`
  rather than with the keyword.
- **Self-assessed faithfulness is not evidence.** §3's reflection may run; its
  verdict is never recorded as a faithfulness result. The record comes from
  `proof-narrative-lean-equivalence` and `lean-proof-vacuity-audit`, run as
  separate passes.
- **No completeness claim from "it all compiles".** A paper whose statements
  all compiled, some on axioms and some on assumed hypotheses, is a paper
  partly formalised. Say which part.

## Where this rendering stops

- **The agent, model and tool stack are not adopted.** The language-server
  bridge, semantic search and grep are one way to give an agent Lean's view;
  `formalizer` and `lean-build-fix` carry this platform's own.
- **The synthetic-data and peer-review visions (§5.2) are not adopted.** They
  are the authors' prospects, not results.
- **The attempt cap of 30 is not adopted as a number.** A cap is necessary —
  an unbounded loop does not terminate on an unprovable statement — and its
  value is a cost choice, not something one run on three papers can settle.
