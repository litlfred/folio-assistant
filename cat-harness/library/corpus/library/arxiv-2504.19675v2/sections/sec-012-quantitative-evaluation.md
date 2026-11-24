---
doc_id: arxiv-2504.19675v2
doc_title: "Annif at SemEval-2025 Task 5: Traditional XMTC augmented by LLMs"
section_id: sec-012-quantitative-evaluation
section_title: "Quantitative evaluation"
section_number: null
pages: 4-4
source_pdf: 2504.19675v2.pdf
source_sha256: 5e8e75c26a95847b
toc_source: outline
---
The quantitative evaluation involved comparing
the subject predictions with subject annotations
in TIBKAT records using precision, recall, and F1
scores (with various thresholds from 5 to 50). The
overall ranking was determined by average recall,
calculated by averaging the recall scores over all
threshold values. Our #9 runs, BMX simple ensem-
ble with combined languages (de+en), ranked 1st
in the all-subjects category with an average recall
score of 0.6295 and 2nd in the tib-core-subjects cat-
egory with a score of 0.5899 (see Table 1 for full
results).
5.2
Qualitative evaluation
The qualitative evaluation was performed by sub-
ject librarians. Our tib-core-subjects run #9 was
chosen for the qualitative evaluation. 6–10 record
files from each of 14 different subject classifica-
tions were chosen, and the top 20 GND codes from
the submissions were evaluated by marking the
predictions as correct (Y), technically correct but
irrelevant (I), or incorrect (N or blank).
Based on these ratings, two different types of
qualitative results were calculated. In case 1, both
Y and I were considered correct, while in case 2,
only Y was considered correct. Precision, recall
and F1 scores across various thresholds (from 5
to 20) were calculated. For the recall calculation,
the set of correct subjects was defined as the union
of TIBKAT subject annotations and all the subject
suggestions from the various systems that were
considered correct by the evaluators. The systems
were ranked based on their average recall scores
across the specified thresholds. Our system ranked
4th in both evaluations (see Table 2).
Case
System
Avg Recall
Rank
1
DNB-AI-Project
0.5657
1st
DUTIR831
0.5330
2nd
RUC Team
0.5199
3rd
Annif (ours)
0.5024
4th
jim
0.4928
5th
2
DNB-AI-Project
0.5094
1st
DUTIR831
0.4851
2nd
RUC Team
0.4645
3rd
Annif (ours)
0.4484
4th
jim
0.4258
5th
Table 2: Qualitative evaluation results for the top 5
teams in evaluation cases 1 and 2.
5.3
