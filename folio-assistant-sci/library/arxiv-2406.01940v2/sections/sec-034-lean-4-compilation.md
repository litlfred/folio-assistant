---
doc_id: arxiv-2406.01940v2
doc_title: "Work in progress PROCESS-DRIVEN AUTOFORMALIZATION IN LEAN 4"
section_id: sec-034-lean-4-compilation
section_title: "Lean 4 Compilation"
section_number: null
pages: 27-27
source_pdf: 2406.01940v2.pdf
source_sha256: 1cfc906589df5afc
toc_source: outline
---
In this section, we outline the specific versions of libraries utilized and the details about the compila-
tion process in Lean 4 in our experiments.
Lean 4 Compiler:
The Lean 4 Compiler is a critical component of the Lean 4 programming
language. This tool enables users to craft effective proof automation tactics within the Lean envi-
ronment and transform them into optimized C code. The Lean 4 Compiler in our scope is referred
to as the tool available at https://github.com/leanprover-community/repl. This
particular resource provides a read-eval-print loop (REPL) designed for Lean 4, which supports
user interaction through JSON formatted input and output streams (stdin and stdout, respectively).
Our compilation projection is therefore founded on REPL. We also developed a multiprocessing
framework to streamline the compilation of Lean 4, which is attached in the supplementary material.
Standard library:
We acknowledge that Lean 4 is still in active development, as are its associated
libraries such as mathlib and others. To maintain consistency and reproducibility, we fixed our Lean 4
version from the official website. We specify the versions and sources of required libraries as shown
in Table 11.
Table 11: Library versions and sources of Lean 4.
Name
URL
Revision
Input Revision
mathlib
https://github.com/leanprover-community/mathlib4
3cecb82
3cecb82
std
https://github.com/leanprover/std4
e5306c3b
main
Qq
https://github.com/leanprover-community/quote4
fd76083
master
aesop
https://github.com/leanprover-community/aesop
8be30c2
master
proofwidgets
https://github.com/leanprover-community/ProofWidgets4
fb65c47
v0.0.30
Cli
https://github.com/leanprover/lean4-cli
be8fa79
main
importGraph
https://github.com/leanprover-community/import-graph.git
61a7918
main
Running Time:
It’s crucial to note that there is significant room for improvement in Lean 4’s
compilation times. The compilation duration varies depending on factors such as theorem complexity,
dependencies on relevant lemmas or theorems, etc. Compiling 1k examples requires around 10
minutes. This duration is notably longer than the generation time for a large language model, which
typically takes only 1-2 minutes to generate output on 1k samples.
J
