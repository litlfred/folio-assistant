---
doc_id: arxiv-2406.01940v2
doc_title: "Work in progress PROCESS-DRIVEN AUTOFORMALIZATION IN LEAN 4"
section_id: sec-013-enhanced-autoformalizer-performance
section_title: "Enhanced Autoformalizer Performance"
section_number: null
pages: 8-9
source_pdf: 2406.01940v2.pdf
source_sha256: 1cfc906589df5afc
toc_source: outline
---
We compare four autoformalizer models: 1) Baseline Autoformalizer (Baseline) 2) Rejective Sam-
pling Fine-tuned (RFT) Autoformalizer (Yuan et al., 2023; Wu et al., 2022) 3) Verifier-Enhanced
Autoformalizer (VEA) 4) Combined RFT and Verifier-Enhanced Autoformalizer (RFT+VEA).
Results are presented in Table 4, and our analysis reveals three key findings:
Effectiveness of Finetuning on FORML4: Even our baseline model, which is finetuned on the
FORML4 training data, significantly outperforms both open-source and closed-source LLMs across
all test sets. This dramatic improvement indicates the effectiveness of our dataset and training
approach in enhancing autoformalization performance.
8
Work in progress
Complementary Strengths of RFT and VEA: RFT significantly improves autoformalization across
all test sets but is time-consuming due to its reliance on the Lean 4 compiler. In contrast, VEA offers
a more time-efficient approach by using predictive labels from our trained verifier, though it may not
match RFT’s data quality. This trade-off between performance and efficiency suggests that these
methods could be valuable in different scenarios, depending on the specific requirements of the task.
Synergistic Benefits of Combined Approach: The RFT+VEA model, which combines the strengths
of both methods, shows the best performance across all test sets. This finding is particularly
noteworthy, as it demonstrates that the verifier, despite being trained using feedback from the Lean 4
compiler, can contribute additional value when combined with direct compiler feedback for filtering
training data. We propose this is due to the limitations of compilation alone in ensuring semantic
alignment between formal and informal statements Lu et al. (2024b). The Lean 4 compiler can
only validate the formal proof’s correctness, not its semantic correspondence to the original natural
language. In contrast, our verifier can take both the formal statement and the informal statement
with proof as input, and the superior performance of RFT+VEA suggests a potential solution to the
long-standing challenge of ensuring semantic alignment between formal and informal statements
in autoformalization. The success of the combined RFT+VEA approach further underscores the
potential for iterative improvements in autoformalization techniques.
5.2
