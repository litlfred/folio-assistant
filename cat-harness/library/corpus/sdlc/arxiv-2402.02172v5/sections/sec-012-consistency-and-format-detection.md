---
doc_id: arxiv-2402.02172v5
doc_title: "CodeAgent : Autonomous Communicative Agents for Code Review"
section_id: sec-012-consistency-and-format-detection
section_title: "Consistency and Format Detection"
section_number: null
pages: 7-8
source_pdf: arxiv-2402.02172v5.pdf
source_sha256: aedb2b60076ad951
toc_source: outline
---
In this section, we will discuss the performance
of CodeAgent and baselines on metrics like the
F1-Score and recall score of task CA and FA. For
CA and FA, the dataset we have is shown in Ta-
ble 1 and more detailed data information is shown
in Figure 7 in Appendix.
Code Change and Commit Message Consis-
tency Detection.
As illustrated in Table 3, we
assess the efficacy of CodeAgent in detecting
the consistency between code changes and commit
messages, contrasting its performance with other
prevalent methods like CodeBERT, GPT-3.5, and
GPT-4.0. This evaluation specifically focuses on
merged and closed commits in nine languages. In
particular, CodeAgent exhibits remarkable per-
formance, outperforming other methods in both
merged and closed scenarios.
In terms of Re-
call, CodeAgent achieved an impressive 90.11%
for merged commits and 87.15% for closed ones,
marking a considerable average improvement of
5.62% over the other models.
Similarly, the
F1-Score of CodeAgent stands at 93.89% for
merged and 92.40% for closed commits, surpass-
ing its counterparts with an average improvement
of 3.79%. More comparable details in different
languages are shown in Appendix-Section. K.
Table 3: Comparison of CodeAgent with other meth-
ods on merged and closed commits across 9 languages
on CA task. ‘Imp’ represents the improvement.
Merged
CodeBERT
GPT-3.5
GPT-4.0
COT
ReAct
CodeAgent
Imp (pp)
Recall
63.64
80.08
84.27
80.73
82.04
90.11
5.84
F1
75.00
87.20
90.12
87.62
88.93
93.89
3.77
Closed
CodeBERT
GPT-3.5
GPT-4.0
COT
ReAct
CodeAgent
Imp (pp)
Recall
64.80
79.05
81.75
81.77
83.42
87.15
5.21
F1
77.20
87.35
89.61
89.30
89.81
92.40
3.35
Average
CodeBERT
GPT-3.5
GPT-4.0
COT
ReAct
CodeAgent
Imp (pp)
Recall
64.22
79.57
83.01
81.25
82.73
88.63
5.62
F1
76.01
87.28
89.61
88.46
89.37
93.16
3.79
Format Consistency Detection.
In our detailed
evaluation of format consistency between commits
and original files, CodeAgent’s performance
was benchmarked against established models like
CodeBERT and GPT variants across nine different
languages. This comparative analysis, presented
in Table 4, was centered around pivotal met-
rics such as Recall and F1-Score. CodeAgent
demonstrated a significant edge over the state-of-
the-art, particularly in the merged category, with
an impressive Recall of 89.34% and an F1-Score
of 94.01%. These figures represent an average im-
provement of 10.81% in Recall and 6.94% in F1-
Score over other models. In the closed category,
CodeAgent continued to outperform, achieving
a Recall of 89.57% and an F1-Score of 94.13%,
surpassing its counterparts with an improvement
of 15.56% in Recall and 9.94% in F1-Score.
The overall average performance of CodeAgent
further accentuates its superiority, with a Recall
of 89.46% and an F1-Score of 94.07%, mark-
ing an average improvement of 13.39% in Re-
call and 10.45% in F1-Score. These results un-
derscore CodeAgent’s exceptional capability in
accurately detecting format consistency between
commits and their original files.
Table 4: Comparison of CodeAgent with other meth-
ods on merged and closed commits across the 9 lan-
guages on FA task. ‘Imp’ represents the improvement.
Merged
CodeBERT
GPT-3.5
GPT-4.0
COT
ReAct
CodeAgent
Imp (pp)
Recall
60.59
60.72
78.53
70.39
71.21
89.34
10.81
F1
74.14
74.88
87.07
80.69
82.18
94.01
6.94
Closed
CodeBERT
GPT-3.5
GPT-4.0
COT
ReAct
CodeAgent
Imp (pp)
Recall
69.95
73.61
68.46
73.39
74.01
89.57
15.56
F1
80.49
84.19
80.16
83.65
83.90
94.13
9.94
Average
CodeBERT
GPT-3.5
GPT-4.0
COT
ReAct
CodeAgent
Imp (pp)
Recall
65.27
67.17
73.50
71.89
72.61
89.46
15.96
F1
77.32
79.54
83.62
82.17
83.04
94.07
10.45
4.3
