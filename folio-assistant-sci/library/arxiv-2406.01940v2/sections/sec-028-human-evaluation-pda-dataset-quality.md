---
doc_id: arxiv-2406.01940v2
doc_title: "Work in progress PROCESS-DRIVEN AUTOFORMALIZATION IN LEAN 4"
section_id: sec-028-human-evaluation-pda-dataset-quality
section_title: "Human Evaluation: PDA Dataset Quality"
section_number: null
pages: 24-25
source_pdf: 2406.01940v2.pdf
source_sha256: 1cfc906589df5afc
toc_source: outline
---
After obtaining the final dataset, we perform a more extensive manual verification on the informalized
dataset, compared to the preliminary one in the model selection stage. Because the core goal of
FORML4 is to train and evaluate statement autoformalization, the human verification task only
includes annotating the informalization success specific to statement translation. We recruited a
different group of four human experts in Lean 4 than in the model selection stage to perform manual
quality checks on 60 samples. Among them, 20 samples come from the basic test set, and 40 from
the random test/train set.
The average success rate evaluated by human experts is 0.72, indicating a relatively high-quality
informalization performance. The intra-rater standard deviation of 0.44 suggests moderate variability
in individual assessments while inter-rater Fleiss’ Kappa is 0.3730, showing fair agreement among
four raters, highlighting a reasonable level of consensus in evaluations.
24
Work in progress
Notably, all four human evaluators comment on the same two challenges during the annotation task:
1. The incompatibility of certain theorem statements for informalization due to their topics or
settings.
2. Individual subjectivity in determining the condition constraints that need to be specified in
natural language (Azerbayev et al., 2023a; Ying et al., 2024a).
As emphasized in past autoformalization research, such challenges are due to the highly parallel gap
between formal and natural language, with the former requiring precision and syntactic rigidity while
the latter suffering from ambiguity and reliance on contexts (Liu et al., 2023a; Jiang et al., 2023a).
As the formal theorem complexity rises, it likely widens such a gap that the informalization difficulty
also increases. This is reflected in the split stats between the basic test set (0.875) and the random test
set (0.575) show a significant discrepancy in the human-verified informalization success rate (p =
0.0099).
G
