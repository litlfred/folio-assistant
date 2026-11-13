---
doc_id: arxiv-2602.16554v1
doc_title: "MERLEAN: AN AGENTIC FRAMEWORK FOR AUTOFOR- MALIZATION IN QUANTUM COMPUTATION"
section_id: sec-006-experiments
section_title: "Experiments"
section_number: null
pages: 4-5
source_pdf: 2602.16554v1.pdf
source_sha256: 765ef86c1c0d4518
toc_source: outline
---
We evaluate MerLean on three papers in theoretical quantum computing: one unpublished manuscript
to guarantee zero data contamination, and two published papers to assess performance on existing
literature.
• Paper A: Balanced Product Codes (Breuckmann & Eberhardt, 2021). This paper studies
quantum codes constructed from tensor products and fiber bundles of chain complexes.
The mathematical machinery includes homological algebra, tensor product of complexes,
expander graphs and spectral expansion.
• Paper B: Fault-Tolerant Quantum Computation (Williamson & Yoder, 2024). This
paper provides a comprehensive treatment of stabilizer codes and fault-tolerant protocols.
The mathematical content includes stabilizer formalism and Pauli algebra, transversal gates,
gauging graphs, fault-tolerant state preparation and measurement.
• Paper C: Quantum Topology. This is an unpublished manuscript, ensuring the content
has never appeared in any LLM training data. The manuscript proves several algebraic and
group-theoretic properties of some map on quantum computational systems. Details will be
released later.
These three projects demonstrate the agent’s capability to formalize and bridge logical gaps in
frontier rigorous research, regardless of whether the content is present in the base LLM’s training
data. An interactive example of the Fault-Tolerant QC formalization output is available at https:
//doxtor6.github.io/MerLean-examples/.
4.1
RESULTS
Table 1: Summary of formalization experiments per paper.
Paper
Statements
Lines of Lean
Declarations
Time
Balanced Product
44
14,997
730
20h 4m
Fault-Tolerant QC
47
18,557
923
11h 41m
Quantum Topology
23
7,761
397
7h 51m
Table 2: Formalization statistics by statement type across all three papers.
Type
Count
Avg. Time
Avg. Compiles
Definition
49
18m 0s
11.7
Theorem
15
39m 41s
22.4
Lemma
20
33m 22s
18.3
Remark
26
10m 34s
7.1
Corollary
4
19m 23s
5.5
Total/Avg
114
21m 54s
13.0
Across all three papers, MerLean formalized 114 statements totaling 2,050 Lean declarations in under
42 hours of wall-clock time. Supported by manual review to ensure all new definitions and axioms
are mathematically accurate and rigorously constructed, MerLean successfully formalized all three
papers, demonstrating its capability on both novel and published content. The Balanced Product
Codes paper required explicit axioms for 9.1% of statements, corresponding to results depending
on machinery not yet in Mathlib (e.g., spectral sequences, K¨unneth isomorphisms for F2-chain
complexes). Theorems were the hardest to formalize, averaging 39m 41s and 22.4 compile attempts,
while remarks were the easiest at 10m 34s and 7.1 compiles with no axioms required. A representative
fully-proved theorem is shown in Appendix A.1.
Figure 2 shows the distribution of compile attempts per statement, broken down by type and paper.
The distribution is heavily right-skewed across all three papers: most statements compile within
4
0
10
20
30
40
50
Compile Attempts
0
2
4
6
8
10
Number of Statements
(a)  Balanced Product Codes (n = 44)
0
10
20
30
40
50
Compile Attempts
0
4
8
12
16
20
(b)  Fault-Tolerant QC (n = 47)
0
10
20
30
40
50
Compile Attempts
0
2
4
6
8
(c)  Quantum Topology (n = 23)
Definition
Remark
Lemma
Theorem
Corollary
Figure 2: Distribution of compile attempts by statement type for each paper (maximum 30 attempts
before axiom phase). Most statements resolve within 1–10 attempts; theorems and lemmas require
significantly more iterations.
1–10 attempts, but a long tail of “hard” statements requires 21+ iterations. Balanced Product Codes
exhibits the widest spread, reflecting its reliance on advanced algebraic machinery (spectral sequences,
K¨unneth formulas) not yet in Mathlib. Fault-Tolerant QC is heavily concentrated in the low-compile
regime, with 23 of 47 statements resolving within 5–10 attempts; its two theorems are the only
statements exceeding 20 compiles. Quantum Topology shows a more uniform distribution, consistent
with its smaller but technically diverse statement set. Across all papers, theorems and lemmas
dominate the high-compile bins, while definitions and remarks cluster in the lower range.
4.2
