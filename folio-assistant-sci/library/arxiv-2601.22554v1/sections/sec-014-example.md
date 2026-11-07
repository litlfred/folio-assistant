---
doc_id: arxiv-2601.22554v1
doc_title: "LeanArchitect LeanArchitect"
section_id: sec-014-example
section_title: "Example"
section_number: null
pages: 11-13
source_pdf: 2601.22554v1.pdf
source_sha256: d5f16d2420823218
toc_source: outline
---
We begin with an illustrative example of LeanArchitect.
import Architect
@[blueprint]
inductive MyNat : Type where
| zero : MyNat
| succ : MyNat →MyNat
namespace MyNat
@[blueprint "def:nat-add"
(statement := /-- Natural number addition. -/)]
def add (a b : MyNat) : MyNat :=
match b with
| zero => a
| succ b => succ (add a b)
LeanArchitect
12
@[simp, blueprint
(statement := /-- For any natural number $a$, $0 + a = a$,
where $+$ is \cref{def:nat-add}. -/)]
theorem zero_add (a : MyNat) : add zero a = a := by
/-- The proof follows by induction. -/
induction a <;> simp [*, add]
@[blueprint
(statement := /-- For any natural numbers $a, b$,
$(a + 1) + b = (a + b) + 1$. -/)]
theorem succ_add (a b : MyNat) : add (succ a) b = succ (add a b) := by
/-- Proof by induction on $b$. -/
sorry
@[blueprint
(statement := /-- For any natural numbers $a, b$,
$a + b = b + a$. -/)]
theorem add_comm (a b : MyNat) : add a b = add b a := by
induction b with
| zero =>
have := trivial
/-- The base case follows from \cref{MyNat.zero_add}. -/
simp [add]
| succ b ih =>
/-- The inductive case follows from \cref{MyNat.succ_add}. -/
sorry_using [succ_add]
-- the ‘sorry_using‘ tactic declares dependency
-- Additional content omitted
end MyNat
The dependency graph of the generated blueprint5 is visualized in Figure 3. Note the automatically inserted
statements and proofs, and the relations between the nodes.
(a) Blueprint document.
(b) Dependency graph.
Figure 3: The blueprint generated from the example Lean file (Section A.1).
5See the hosted blueprint.
LeanArchitect
13
A.2
