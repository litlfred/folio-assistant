---
doc_id: arxiv-2406.01940v2
doc_title: "Work in progress PROCESS-DRIVEN AUTOFORMALIZATION IN LEAN 4"
section_id: sec-005-curation-process
section_title: "Curation Process"
section_number: null
pages: 4-6
source_pdf: 2406.01940v2.pdf
source_sha256: 1cfc906589df5afc
toc_source: outline
---
existing datasets (Section 3.4).
3.1
DATA SOURCE
Statement and Proof Extraction We start by extracting formal statements and proofs from Lean
4 theorems in Mathlib 42, one of the most extensive formal mathematics libraries available. This
process is adapted from the implementation of LeanDojo3 (Yang et al., 2023a) to search for and
extract theorems from Mathlib 4. However, unlike LeanDojo focuses on extracting theorem names
and tactics4 for theorem proving, we extract the complete content of both the statement and the proof,
aiming to provide comprehensive content for improved autoformalization.
Datasets Split We randomly sample theorems (including their statements and proofs) from the
extracted pool of Mathlib 4, and split them to create a training set and a random test set for
training and evaluating LLMs. An example is provided in Appendix Table 8. In addition, for
a more domain-general comprehensive evaluation of a model’s autoformalization performance,
we further include a basic test set and a real test set whose domains differ from the training
set. The basic test set is extracted from Mathlib 4, but it exclusively focuses on the proof for
fundamental concepts in a mathematical topic. For example, such theorems typically appear in
files like mathlib4/Mathlib/Geometry/Euclidean/Basic.lean, which establish core
geometrical concepts and prove simple results about real inner product spaces and Euclidean affine
spaces. In general, the basic test set assesses the model’s ability to autoformalize basic theorems
with minimal reliance on prior knowledge or established lemmas. The real test set is constructed by
collecting natural language math questions and answers from LI et al. (2024). We transform each
question into a natural language statement to be proved by appending the ground-truth answer and a
request to prove the answer is true. By not relying solely on formal mathematical theorems and proof
from Mathlib 4, we extend our evaluation domains to real-world settings. More details of test sets
can be found in Appendix O.2.
3.2
INFORMALIZATION
To obtain natural language data for the extracted formal theorems, we employ a two-step process: 1)
We utilize a LLM to translate formal mathematical statements into natural language (i.e., formaliza-
tion) 2) Next, we generate new informalized versions by first explaining the formalized proof and
then providing a step-by-step proof in natural language. This process avoids verbatim mentions of
Lean 4 functions. Our construction pipeline was further augmented with the following techniques, to
elicit high-quality informalization output from LLMs.
Statemen and Proof Conversion: We instruct the model to convert all components of the formal
content – both statements and proofs – into natural language. While this is computationally heavier
and more challenging as it requires the model to understand the syntax of Lean 4 and the logical
reasoning steps within each proof, the inclusion of proof steps has several benefits in both dataset
construction and evaluation: (1) during informalization, the provided proof steps could potentially
add informative context to the preceded formal theorem statement in the prompt, hence improving
informalization quality, observed both in our human evaluation results (Table 6) and in previous
research (Huang et al., 2024b); (2) in autoformalization, the existence of proof steps also enables us
to examine autoformalization performance by assessing the validity of the formalized combination
of theorem statements and proof using a compiler, increasing the difficulty and granularity of
autoformalization evaluation.
It is important to note that translating proof steps is much more challenging than translating statements
and that FORML4 does not aim at ensuring strict semantic alignment between formal and natural-
language proof in our informalized output. Rather, the inclusion of proof translation serves as an
auxiliary task, first to improve informalization, and second to augment context for autoformalization
evaluation and enhancement, as explained in the two benefits (1) and (2) above. As the automated
autoformalization evaluation using the Lean 4 compiler only checks logical validity in formal
2https://github.com/leanprover-community/mathlib4
3https://github.com/lean-dojo/LeanDojo/blob/main/scripts/generate-benchmark-lean4.ipynb
4Tactics are commands or instructions that describe how to construct such a proof.
4
Work in progress
Table 1: Statistics of FORML4. The test sets do not necessarily require Lean4 ground truth statements
and proofs, since the autoformalized output can be verified by the compiler. The real test set only
contains natural language queries and answers, without any corresponding Lean4 statements.
Dataset
Size
Lean 4
Natural Language
# Chars, State. & Proof
# Chars, Q & A
Mean
Median
Min
Max
Mean
Median
Min
Max
Training
14,250
147
116
39
5507
192
166
30
1485
Random Test
950
152
116
43
3170
188
166
35
836
Basic Test
970
133
96
41
2716
146
135
33
529
Real Test
967
-
-
-
-
1269
1151
134
4909
language, the quality of FORML4 and our evaluation framework does not pertain to whether the
natural-language proof perfectly corresponds to the formal proof.5
Decomposition Strategy: To address the complexity of informalizing both statements and proofs,
we implement a decompositional prompting strategy inspired by task decomposition approaches
in scalable oversight research (Wu et al., 2021). Our strategy breaks down the informalization
process into sequential subtasks: translating the formal statement, explaining each proof step,
and then constructing a natural language proof. This approach effectively differentiates between
explaining Lean 4 terms and creating an independent natural language proof, crucial for meaningful
autoformalization evaluation. The strategy is augmented with few-shot examples to align the model
output with our expectations. Please check Appendix C for the detailed rationale and Appendix D for
the complete prompt template.
3.3
CURATION PROCESS
Preprocessing: Before informalization, we conducted several preprocessing steps on the extracted
theorems to enhance the quality of our formalization output. These steps include retaining spe-
cific commands, filtering certain samples, and removing unsuitable entries. More details on our
preprocessing approach can be found in Appendix O.1.
Model Selection: To ensure high-quality LLM-based informalization, we evaluated two state-of-the-
art LLMs in formal mathematical reasoning: GPT-4 and Gemini-Pro-1.5. Based on a comparative
study involving human annotators, Gemini-Pro-1.5 consistently outperformed GPT-4, achieving
higher scores in informalization success (80% vs. 70%) and being preferred in 80% of samples.
Given its superior performance, we employed Gemini-Pro-1.5 for the informalization process in
constructing FORML4. For detailed evaluation methodology and results, see Appendix K.
Post-processing: Based on the obtained informalized data, we conduct a filtering process to further
guarantee PDA to have high-quality training and testing data for auto-formalization. More details are
listed in Appendix O.3. In FORML4, we further provide a “Theorem Environment” that includes
each theorem’s full dependencies and premises, facilitating easier compilation. Specifically, one only
needs to concatenate the “Theorem Environment” with the autoformalized result to verify the latter,
eliminating the need to delve into the details of Mathlib. This approach simplifies the compilation
process in autoformalization evaluation later.
Human Verification: We conducted an extensive manual verification on the informalized dataset
using a group of four human experts in Lean 4, different from those involved in the model selection
stage. They evaluated 60 samples: 20 from the basic test set and 40 from the random test/train set.
The average success rate was 0.72, indicating relatively high-quality informalization performance.
Please check Appendix F for detailed verification process and analysis.
5In practice, we observe that it is usually infeasible to perfectly translate a set of formal proofs to a natural
language. This is because formal proofs are often expressed in pre-defined lemmas or environments that are
exclusively constructed in the Lean 4 language, and there are no existing corresponding concepts in natural
language that a non-expert in Lean 4 could easily understand.
5
Work in progress
Table 2: Comparison of FORML4 with existing autoformalization datasets.
Characteristic
FORML4
MMA
Lean Workbook
ProofNet
Minif2f
FIMO
(Jiang et al., 2023a)
(Ying et al., 2024a)
(Azerbayev et al., 2023a)
(Zheng et al., 2022a)
(Liu et al., 2023b)
Source Language
Formal
Formal
Natural
Natural
Natural
Natural
Size
17k
332k
57k
371
488
149
Includes Proofs
✓
✗
✗
✓
✗
✗
Uses Lean 4
✓
✓
✓
✗
✗
✗
Construction Method
Direction
Informalization
Informalization
Formalization
Formalization
Formalization
Formalization
LLM-based
✓
✓
✓
✗
✗
✓
Human-Verified
✓
✗
✓
✓
✓
✓
Primary Usage
Training
✓
✓
✓
✗
✗
✗
Benchmarking
✓
✓
✓
✓
✓
✓
Process-Driven Feedback
✓
✗
✗
✓
✗
✗
Notably, the split stats between the basic test set (0.875) and the random test set (0.575) show a
significant discrepancy in the human-verified informalization success rate (p = 0.0099), suggesting
that informalization difficulty increases with formal theorem complexity.
Dataset Statistics: Table 1 displays the final data statistics of FORML4, including the size of each
subset and the length of statement and proof in characters for both Lean 4 and natural language.
3.4
