---
doc_id: arxiv-2601.22554v1
doc_title: "LeanArchitect LeanArchitect"
section_id: sec-011-blueprint-based-autoformalization
section_title: "Blueprint-Based Autoformalization"
section_number: null
pages: 7-9
source_pdf: 2601.22554v1.pdf
source_sha256: d5f16d2420823218
toc_source: outline
---
We evaluate LeanArchitect as an interface for human–AI collaboration by semi-automatically formalizing a
theorem that is both technically nontrivial and naturally decomposable: multivariate Taylor’s theorem in
integral form. At the time of writing, Mathlib contains Taylor’s theorem only in one-dimensional settings and
does not have the multivariate Fréchet-derivative formulation in integral form.
Target theorem. Let E, F be normed vector spaces over R with F complete. Let U ⊆E be open and let
f : U →F be Cn with n > 0. For x, h ∈E such that [x, x + h] ⊆U, we aim to formalize:
f(x + h) =
n−1
X
k=0
1
k! Dkf(x)[h, . . . , h] +
1
(n −1)!
Z 1
0
(1 −s)n−1 Dnf(x + sh)[h, . . . , h] ds,
where Dkf denotes the k-th Fréchet derivative.
Pipeline. Our pipeline uses two AI systems with complementary roles: GPT-5 Pro drafts a natural-language
proof and a corresponding Lean blueprint file (a single Lean module annotated with @[blueprint]), and
Aristotle operates in sorry-filling mode to attempt to complete the resulting proof obligations. Concretely:
1. GPT-5 Pro produces a structured proof outline and translates it into a Lean file whose intermediate
lemmas are tagged with @[blueprint] and initially proved with sorry.
2. We visualize progress using the generated blueprint dependency graph.
3. Aristotle (sorry-filling mode) attempts to discharge the sorry nodes automatically.
4. Remaining failures are iteratively addressed by refining the blueprint using GPT-5 Pro.
5. Finally, a human manually proves remaining parts that could not be automatically proved.
Progress visualization. Figure 2a shows the initial blueprint produced from GPT-5 Pro’s Lean draft, and
Figure 2b shows the result after Aristotle’s first pass. We then refined the blueprint based on the remaining
unproved nodes (Figures 2c and 2d). After refinement, Aristotle proved all but three nodes.
LeanArchitect
8
(a) GPT-5 Pro: initial blueprint.
(b) Aristotle: fill proofs in initial blueprint.
(c) GPT-5 Pro: refined blueprint.
(d) Aristotle: fill proofs in refined blueprint.
(e) Completed formalization by human.
Figure 2: Progress of blueprint-based autoformalization for multivariate Taylor’s theorem. Blue nodes are
unproved lemmas; green nodes are proved lemmas. Rectangles denote definitions; circles denote theorems.
Inspection of the remaining failures revealed a systematic issue in the initial formalization: one should use
derivWithin rather than deriv for a function f : R →E differentiable on [a, b]. We corrected the affected
statements manually, making intermediate lemmas true, and then proved the remaining lemmas by hand.
Outcome. This proves the target theorem in Lean:
import Mathlib
open scoped Nat
variable {E : Type*} [NormedAddCommGroup E] [NormedSpace R E]
variable {F : Type*} [NormedAddCommGroup F] [NormedSpace R F] [CompleteSpace F]
theorem frechet_taylor_integral
{U : Set E} {f : E →F} {n : N} (hn : 0 < n)
(hCn : ContDiffOn R n f U) (hU : IsOpen U)
{x h : E} (hseg : ∀s ∈Set.Icc (0 : R) 1, x + s · h ∈U) :
f (x + h) =
(Σ k ∈Finset.range n, ((k)! : R)−1 · iteratedFDeriv R k f x fun _ 7→h) +
((n - 1)! : R)−1 · R
s in (0 : R)..1,
(1 - s) ^ (n - 1) · iteratedFDeriv R n f (x + s · h) fun _ 7→h
This case study highlights two advantages of blueprint-structured autoformalization. First, failures are
localized: rather than treating the attempt as an all-or-nothing proof search, we can focus human attention
on a small set of remaining nodes identified in the dependency graph. Second, progress is transparent and
compositional: partial success yields reusable intermediate lemmas, and the dependency structure provides a
LeanArchitect
9
natural unit of work for automated provers. More broadly, the blueprint acts as a shared interface between
humans and automation: humans refine the decomposition and hypotheses, while automated systems attempt
the resulting subgoals.
We also observed a limitation of the current human–AI loop: simply asking the language model to “refine” the
blueprint did not reliably address the underlying causes of failure, partly because the prover provides limited
diagnostic feedback beyond a list of unsolved nodes. Closing this loop will likely require richer feedback signals
(e.g. counterexamples, missing lemma suggestions, or structured failure traces) that can be consumed by the
planner model.
5
