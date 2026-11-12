---
doc_id: arxiv-2601.22554v1
doc_title: "LeanArchitect LeanArchitect"
section_id: sec-006-latex-export
section_title: "LaTeX Export"
section_number: null
pages: 5-5
source_pdf: 2601.22554v1.pdf
source_sha256: d5f16d2420823218
toc_source: outline
---
To build the LATEX blueprint from such data, LeanArchitect provides a build-time export mechanism
integrated with Lean’s Lake build system, inspired by doc-gen4. For each module, blueprint data is ex-
tracted and rendered into LATEX fragments that can be imported into an existing blueprint document
using the macro \inputleannode{label}. Multiple Lean declarations are allowed to correspond to a single
blueprint node. The export process is deterministic and incremental. For example, when the user writes
\inputleannode{thm:add-comm} in the LATEX blueprint, it will be expanded to:
% Statement
\begin{theorem}
\label{thm:add-comm} \lean{MyNat.add_comm}
% Identifiers
\leanok \uses{def:nat}
% Status and dependencies
Addition in $N$ is commutative.
% Text
\end{theorem}
% Proof
\begin{proof}
\uses{lem:zero-add, lem:succ-add}
% Status and dependencies
By induction and then
% Text
\cref{lem:zero-add, lem:succ-add}.
\end{proof}
Then, the final step to produce a PDF and web visualization of the blueprint and its dependency graph is
done using leanblueprint.
3.5
