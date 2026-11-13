---
doc_id: arxiv-2406.01940v2
doc_title: "Work in progress PROCESS-DRIVEN AUTOFORMALIZATION IN LEAN 4"
section_id: sec-015-human-evaluation-on-autoformalizer-performances
section_title: "Human Evaluation on Autoformalizer Performances"
section_number: null
pages: 10-11
source_pdf: 2406.01940v2.pdf
source_sha256: 1cfc906589df5afc
toc_source: outline
---
To accurately investigate the autoformalization performances of our PDA model in different settings,
we conduct an extensive post-hoc human evaluation on the autoformalizers’ output about whether the
natural-language statements are successfully translated into formal statements.
Goal
Human experts give the most accurate evaluations on strict semantic alignment between
natural and formal languages, which the automated compiler falls short of even empowered with
appended proof steps in PDA (Lu et al., 2024b). We ensure all samples can pass the Lean4 compiler
alone without the proof part, meaning the statement is syntactically true.
Factorial Design
In particular, we investigate in detail whether the following variable changes will
impact model autoformalization performances:
• Proof Validity: whether the autoformalized sample can pass the Lean4 compiler with both
statement and proof. If false, it means that the statement along with the proof cannot pass
the Lean4 compiler, indicating that there is a logical fallacy either inside the statement itself
or within proof steps. We group the sampled output so that half (30 samples) are labeled
false in proof validity, and the other true.
• PDA Enhancement: whether the autoformalized sample is outputted by a baseline autofor-
malizer or a RFT + VEA enhanced autoformalizer in 12.
• Test Set Categories: Since the test sets vary in difficulty level and question types, we
include the dataset split factor by extracting test sets in the closely identical proportional
distribution as the full-size PDA test set: random (20 samples): basic (20 samples): real (20
samples) ≈1 : 1 : 1.
Based on the assigned factors in the evaluation samples, we investigate the following hypotheses to
analytically support the validity of PDA method:
1. Those whose proof validity is true achieve significantly better autoformalization perfor-
mances. This will support our argument about PDA in using process-level compiler feedback
from statement+proof to better indicate the semantic and logical validity of autoformalized
statements.
2. The enhanced autoformalizer achieves significantly better autoformalization performances.
This can further support the validity of our enhancement approach to improve not only
compiling successes but also human-evaluated semantic alignment.
3. The autoformalization performance is higher in the basic and real test sets than due to their
lower difficulty and complexity level.
Results
As suggested in 5.3, our factor grouping statistics generally support the three hypotheses.
Specifically, Proof Validity (p = 0.002992) and Dataset Split (p = 0.000002) show high significance
in ANOVA results, supporting our first and third hypotheses. Regarding the comparison between
the baseline and enhanced autoformalizer model, though the statistical significance is not obtained,
we still find the higher evaluation score in the enhanced model consistent with our expectations. In
general, the human evaluation results of autoformalization models further validates the robustness
and effectiveness of the PDA autoformalization training and evaluation framework.
10
Work in progress
6
