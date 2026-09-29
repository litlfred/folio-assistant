---
doc_id: arxiv-2406.01940v2
doc_title: "Work in progress PROCESS-DRIVEN AUTOFORMALIZATION IN LEAN 4"
section_id: sec-019-detailed-decomposition-strategy
section_title: "Detailed Decomposition Strategy"
section_number: null
pages: 20-21
source_pdf: 2406.01940v2.pdf
source_sha256: 1cfc906589df5afc
toc_source: outline
---
Our decomposition strategy for informalization involves instructing the model to perform the follow-
ing subtasks sequentially:
1. Translate the formal statement into a natural-language problem.
20
Work in progress
2. Explain the meaning of each step of the formal proof in natural language, based on the
definition of the employed lemma or tactics.
3. Write a step-by-step proof of the problem in natural language without verbatim mention of
any Lean 4 function.
For FORML4 construction, we extract only the translated natural-language problem and the step-by-
step proof from the model output to form the natural-language data.
The strategy of explaining each tactic step before writing the natural-language proof serves two
crucial purposes: 1. It creates a reasoning buffer for the model. 2. It effectively differentiates between
’listing and explaining each Lean 4 term from the formal proof in natural language’ and ’proving the
problem statement step by step in natural language’, with the latter being our intended goal.
Our empirical observations indicate that a naive instruction prompt without decomposition often
leads to ambiguity. Models tend to write natural-language proof steps by explaining each term in the
formal proof steps (and even in the formal statement), regardless of verbal emphasis on the distinction.
This approach would render autoformalization evaluation meaningless, as the formal content would
already exist in the input.
In contrast, decomposing our complex goal into separate subtasks effectively addresses this issue,
as verified by human expert evaluators. The decomposition strategy ensures that the resulting
natural language proof is genuinely independent of the formal proof structure, making it suitable for
autoformalization tasks.
We further enhance the strategy by adding few-shot examples to better align the model with our
expected format and goal. The complete prompt template, including these examples, can be found in
Appendix D.
D
