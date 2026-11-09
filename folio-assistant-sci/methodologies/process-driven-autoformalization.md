---
$schema: folio-methodology/v1
name: process-driven-autoformalization
title: Process-driven autoformalization — judge a formalised statement by compiling it WITH a proof, and read the first error as the step signal
origin: >
  Jianqiao Lu, Yingjia Wan, Zhengying Liu, Yinya Huang, Jing Xiong, Chengwu
  Liu, Jianhao Shen, Hui Jin, Jipeng Zhang, Haiming Wang, Zhicheng Yang, Jing
  Tang and Zhijiang Guo, "Process-Driven Autoformalization in Lean 4"
  (arXiv:2406.01940v2 [cs.CL], 14 October 2024; version 1, June 2024). The
  paper labels itself "Work in progress". Open access.

  It is a MACHINE-LEARNING paper: it contributes a dataset (FormL4, built by
  informalizing Mathlib 4 theorems) and a training loop (an autoformalizer and
  a verifier fine-tuned against Lean compiler feedback). This platform trains
  no models, so what is adopted below is the small part of the method that
  survives without training; §"Where this rendering stops" is long on purpose.
evidence:
  - library/arxiv-2406.01940v2
applies-when: >
  **A natural-language statement is being turned into a Lean statement and the
  question is how to test the candidate**, or **a Lean statement is being
  turned into prose** (a blueprint, a docstring, a narrative) and the question
  is how to keep that prose independent of the Lean it came from. Use it for
  the two checks it names — compile the statement together with a proof, and
  decompose informalization so the result is not a paraphrase of the syntax.

  Do NOT use it as evidence that a statement is FAITHFUL. The paper says itself
  that the compiler "can only validate the formal proof's correctness, not its
  semantic correspondence to the original natural language" (§5.1.2). Not for
  choosing, training or ranking models: the numbers in it are about the
  authors' models on the authors' dataset.
---

# Process-driven autoformalization

The paper's target is **statement** autoformalization (Figure 1 caption: the
goal "does not include the translation of proof per se"). Its move is to
translate the proof anyway, so that the compiler has more to check.

## 1 — Compile the statement WITH a proof, not alone

A candidate formal statement that elaborates on its own has passed a syntax
and typing check and nothing more. The paper's observation (Figure 1, §1) is
that compiling statement and proof steps together gives the compiler a chance
to reject a statement that type-checks but is not the intended one — its
worked example is a statement that compiles alone, whose proof step then fails
with a type mismatch, exposing that the statement was mis-formalised.

**What that check establishes, stated as logic rather than as the paper's
framing**, because the difference matters:

- **Proof compiles** ⟹ the Lean statement is a theorem (relative to the axioms
  the proof uses). It says nothing about whether it is the *intended* theorem:
  a weakened, specialised or vacuously-true misformalisation compiles with a
  proof just as well — more easily, usually.
- **Proof fails** ⟹ either the statement is not provable as written, or the
  proof is wrong. It does not say which.

So the signal is **one-sided and cheap**: it catches some statements that are
false as written, and it cannot certify one that is true. It is a filter in
front of the faithfulness audits, never a replacement for them. That is
consistent with the paper's own human evaluation (§5.3), which found samples
that pass with their proof scoring better on semantic alignment on average —
an association in a 60-sample study, not a guarantee for any given statement.

## 2 — The first error location is the step signal

For its verifier the paper labels each proof step by the **first error**
principle (§4.1, after Uesato et al. 2022): steps before the first
compiler-reported error are labelled correct, steps after it incorrect.

What survives without training a verifier: when a compile-fix loop reports an
error, **the prefix before the first error is the part that has been checked,
and nothing after it has** — later diagnostics are conditioned on an already
broken state and are weak evidence about their own lines. Work the first error;
re-compile; read again. This is ordinary Lean practice and the paper adds a
reason for it rather than inventing it.

## 3 — Informalize by decomposition, or the prose will be the syntax

To build its dataset the paper translated Lean to natural language in three
sequential sub-tasks (§3.2, Appendix C):

1. translate the formal **statement** into a natural-language problem;
2. **explain each step** of the formal proof, using what each lemma or tactic
   means;
3. write a step-by-step natural-language **proof without verbatim mention of
   any Lean function**.

Only (1) and (3) are kept. Step (2) exists to be thrown away. The authors'
reason (Appendix C): without it, the model "tend[s] to write natural-language
proof steps by explaining each term in the formal proof", which makes the
prose a transliteration of the Lean — useless as an independent statement of
the mathematics.

**This is the part most worth taking**, and it applies wherever this platform
generates prose from Lean: blueprint text, a docstring, a round-trip
informalization used to audit faithfulness. Prose that restates the Lean term
by term cannot be compared against the paper's prose, because it inherits every
error of the Lean it restates.

## What the paper measured, and what it did not

**These are the paper's findings, reported as such.** None is a mathematical
claim and none was reproduced here.

- Off-the-shelf models of 2024 compiled very few candidates on FormL4 under
  greedy decoding (Table 4: single-digit percentages at best); fine-tuning on
  FormL4 raised that to roughly 22–36% depending on test split and method.
- The process-supervised verifier scored above the outcome-supervised one on
  every split (Table 5); the margins are one to two points.
- Human evaluation (§5.3): 60 samples, four raters. The enhanced
  autoformalizer scored higher than the baseline **without statistical
  significance** — the paper says so. Inter-rater agreement on dataset quality
  was Fleiss' κ ≈ 0.37 (Appendix F), which the authors call "fair": **people
  qualified in Lean disagreed about whether a translation was faithful** about
  as often as that number suggests. A faithfulness verdict from one reader is
  a sample, not a measurement.

**Two inconsistencies in the paper, found by reading it**, so that nobody quotes
a number from it without checking which one:

- Appendix P.3's prose gives GPT-4 a greedy score of 10.20% on the Real test;
  Table 15, which the prose is describing, gives 5.35% (GPT-4-Turbo) and 5.85%
  (GPT-4o).
- Table 4 gives RFT+VEA 26.87 greedy on the Real test; Table 12, reporting the
  same model's greedy score, gives 23.72.

Neither touches §§1–3 above. Both are reasons this node quotes the method and
not the numbers.

## Where this rendering stops

- **No training is adopted.** The autoformalizer, the verifier, rejection
  sampling and the iterative loop between them are model-building, which this
  platform does not do.
- **FormL4 is not adopted.** A benchmark of informalized Mathlib theorems
  measures translation of Mathlib-style statements, not of a folio's
  research-level ones.
- **"Compiles" is never recorded as "faithful".** §1 is a filter. The
  faithfulness question stays with `proof-narrative-lean-equivalence` and
  `lean-proof-vacuity-audit`.
- **The Lean and Mathlib versions it pins (Appendix I.3) are 2024 revisions.**
  Its point — pin them, or the measurement is not reproducible — is already
  this platform's rule (`lean-environment-setup`), and the specific revisions
  are not adopted.
