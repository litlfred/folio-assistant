---
doc_id: arxiv-2601.22554v1
doc_title: "LeanArchitect LeanArchitect"
section_id: sec-005-blueprint-attribute
section_title: "Blueprint Attribute"
section_number: null
pages: 3-5
source_pdf: 2601.22554v1.pdf
source_sha256: d5f16d2420823218
toc_source: outline
---
LeanArchitect provides a new Lean attribute @[blueprint] that can be attached to definitions and theorems.
Users can optionally supply metadata such as a LATEX label, natural language statement and proof, and
other project-management annotations. The attribute serves as the user interface between Lean code and the
blueprint system. A typical example is:
1See the GitHub repository.
2See the GitHub repository.
LeanArchitect
4
LaTeX
Theorems & proofs
Dependency relations
Formalization status
Lean
Definitions
Theorems
Proofs (sorry?)
Manual sync
leanblueprint
Web blueprint
HTML
PDF
Dependency graph
(a) Blueprint generation workflow without LeanArchitect.
LaTeX Artifacts
Inferred relations
Inferred status
Lean
Definitions
Theorems
Proofs (sorry?)
leanblueprint
Web blueprint
HTML
PDF
Dependency graph
LeanArchitect
LaTeX Outline
Blueprint structure
\input
(b) Blueprint generation workflow with LeanArchitect.
Figure 1: Comparison of blueprint generation workflows with and without using LeanArchitect. (a) Without
LeanArchitect, the entire LATEX blueprint needs to be manually written and synchronized with the evolving
formalization part. (b) With LeanArchitect, maintainers only need to manually write the structure of the
LATEX blueprint, whose dependency relations and formalization status are automatically synchronized from
the corresponding Lean part.
@[blueprint "thm:add-comm"
(statement := /-- Addition in $N$ is commutative. -/)]
theorem MyNat.add_comm (a b : MyNat) : a + b = b + a := by
/-- By induction and then \cref{lem:zero-add, lem:succ-add}. -/
induction a with
| zero => exact b.zero_add
| succ a ih => sorry_using [MyNat.succ_add]
3.3
Environment Extension
After tagging a declaration, LeanArchitect constructs an internal representation of the corresponding blueprint
node and stores it in an environment extension blueprintExt. For each tagged declaration, LeanArchitect
automatically infers dependency information by recursively traversing the constants used in the type and
value of the declaration, and determines proof status by checking if sorry is used. Then an internal Node is
constructed; e.g. with the following data:
-- Identifiers
name := MyNat.add_comm, latexLabel := "thm:add-comm"
-- Statement status, dependencies, and text
statement := { leanOk := true, uses := ["def:nat"],
text := "Addition in $N$ is commutative." }
-- Proof status, dependencies, and text
proof := { leanOk := false, uses := ["lem:zero-add", "lem:succ-add"],
text := "By induction and then \cref{lem:zero-add, lem:succ-add}." }
-- Miscellaneous metadata
LeanArchitect
5
notReady := false, discussion := none, title := none
3.4
