---
doc_id: arxiv-2402.02172v5
doc_title: "CodeAgent : Autonomous Communicative Agents for Code Review"
section_id: sec-008-datasets
section_title: "Datasets"
section_number: null
pages: 5-5
source_pdf: arxiv-2402.02172v5.pdf
source_sha256: aedb2b60076ad951
toc_source: outline
---
metrics, and baselines.
For more information,
please see Appendix C.
3.1
Datasets
To conduct a fair and reliable comparison for the
code revision task, we employ the same datasets
(i.e., Trans-Reviewdata, AutoTransformdata, and
T5-Reviewdata) as the state-of-the-art study (Zhou
et al., 2023). Furthermore, we collect and curate
an additional dataset targeting the advanced tasks.
Table 1 shows our new dataset which includes over
3,545 commits and 2,933 pull requests from more
than 180 projects, spanning nine programming
languages: Python, Java, Go, C++, JavaScript, C,
C#, PHP, and Ruby. It focuses on consistency and
format detection, featuring both positive and nega-
tive samples segmented by the merged and closed
status of pull requests across various languages.
The detailed information about the dataset can be
seen in Appendix-Section F.
Table 1: Comparison of Positive and Negative Samples
in CA and FA (CA and FA are defined in Section 2.1).
Samples
CA
FA
Merged Closed Merged Closed
Positive (consistency)
2,089
820
2,238
861
Negative (inconsistency)
501
135
352
94
3.2
Metrics
• F1-Score and Recall. We utilized the F1-
Score and recall to evaluate our method’s
effectiveness on tasks CA and FA. The F1-
Score, a balance between precision and re-
call, is crucial for distinguishing between
false positives and negatives.
Recall mea-
sures the proportion of actual positives
correctly identified (Hossin and Sulaiman,
2015).
• Edit Progress (EP). EP evaluates the im-
provement in code transitioning from erro-
neous to correct by measuring the reduction
in edit distance between the original code
and the prediction on task CR. A higher EP
indicates better efficiency in code genera-
tion (Dibia et al., 2022; Elgohary et al., 2021;
Zhou et al., 2023).
• Hit Rate (Rate) We also use hit rate to eval-
uate the rate of confirmed vulnerability is-
sues out of the found issues by approaches
on task VA.
3.3
