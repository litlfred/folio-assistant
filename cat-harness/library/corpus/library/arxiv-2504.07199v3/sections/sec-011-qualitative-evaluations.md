---
doc_id: arxiv-2504.07199v3
doc_title: "Tagging for a National Technical Library’s Open-Access Catalog"
section_id: sec-011-qualitative-evaluations
section_title: "Qualitative Evaluations"
section_number: null
pages: 8-10
source_pdf: 2504.07199v3.pdf
source_sha256: a6c42fa7f3f5183f
toc_source: outline
---
We now turn to the qualitative manual evaluations
from the shared task’s evaluation phase.
Table 4 shows results for both qualitative evalua-
tion cases. Based on subject librarian assessments,
both Y (correct) and I (irrelevant but technically
correct) labels were counted as correct in case 1,
while only Y was considered correct in case 2. The
top 4 teams ranked consistently across both cases,
with minor changes among the remaining teams.
Case 1 accounts for situations where models pre-
dicted multiple semantically similar subjects as
top-ranked, leading to generally higher precision
scores. However, in practice, it is preferred that
12Precision@k was computed as the number of correct
predictions among the top-k, divided by k. Since TIBKAT
records contain on average around 5 true GND subjects, this
limits how high precision can go at larger k. For example,
even if a system perfectly predicts all 5 true subjects, the max-
imum possible precision at k = 10 would still be 0.5, since
at most 5 out of 10 predictions can be correct. Therefore, for
higher values of k, precision will necessarily be less than 1.
8
qualitative eval. case 1
qualitative eval. case 2
Team Name
P@5
R@5
P@10
R@10
Ov. R@k
Team Name
P@5
R@5
P@10
R@10
Ov. R@k
DNB-AI
0.74
0.33
0.65
0.54
0.57
DNB-AI
0.53
0.34
0.41
0.5
0.51
DUTIR831
0.7
0.31
0.61
0.49
0.53
DUTIR831
0.49
0.32
0.39
0.46
0.49
RUC Team
0.71
0.28
0.6
0.46
0.52
RUC Team
0.48
0.29
0.38
0.43
0.47
Annif
0.66
0.28
0.56
0.46
0.5
Annif
0.46
0.3
0.33
0.42
0.45
TartuNLP
0.63
0.26
0.55
0.44
0.49
Jim
0.4
0.29
0.29
0.39
0.43
Jim
0.62
0.29
0.5
0.44
0.49
icip
0.39
0.28
0.3
0.4
0.42
icip
0.57
0.27
0.48
0.43
0.48
TartuNLP
0.4
0.26
0.31
0.38
0.41
LA2I2F
0.52
0.25
0.43
0.39
0.46
LA2I2F
0.34
0.25
0.25
0.35
0.4
NBF
0.44
0.21
0.41
0.37
0.43
NBF
0.23
0.17
0.2
0.28
0.32
last_minute
0.27
0.15
0.24
0.25
0.29
Homa
0.19
0.15
0.15
0.21
0.22
Homa
0.3
0.16
0.25
0.26
0.27
last_minute
0.13
0.1
0.11
0.18
0.2
YNU-HPCC
0.21
0.14
0.18
0.22
0.26
YNU-HPCC
0.12
0.1
0.1
0.16
0.17
Table 4: Qualitative performance comparison across teams for two cases: case 1 — treating both Y and I as correct,
and case 2 — treating only Y as correct. Metrics reported are precision and recall at k. The ‘Ov. R@k’ columns
represent the average recall across k = 5, 10, 15, 20.
Figure 3: Overall qualitative evaluation results w.r.t. metric@5 and averages per metric@k where k = 5, 10, 15, and
20. On the x-axis, teams are listed in ranked order of performance based on average recall@k.
(a) Average recall@k scores per domain over k = 5, 10, 15, and 20.
(b) Average precision@k scores per domain over k = 5, 10, 15, and 20.
Figure 4: Qualitative results per 14 distinct domains. Acronyms used: Architecture (arc), Chemistry (che), Electrical
Engineering (elt), Material Science (fer), History (his), Computer Science (inf), Linguistics (lin), Literature Studies
(lit), Mathematics (mat), Economics (oek), Physics (phy), Social Sciences (sow), Engineering (tec), and Traffic
Engineering (ver). On the x-axis, teams are listed in alphabetical order of names.
9
models predict semantically distinct and relevant
subjects as top-ranked. Therefore, the remainder of
this section focuses on case 2, where only Y labels
are treated as correct.
The overall results, shown in Figure 3, report
six metrics: P@5, R@5, F1@5, Avg. P@k, Avg.
R@k, and Avg. F1@k, with k ranging from 5 to
20 in the qualitative setting. These results do not
distinguish between all-subjects and tib-core since
the 122 evaluated records were shared across both
collections.13 The top teams from the quantitative
leaderboard (DUTIR831, RUC Team, and Annif)
remained among the top four, with the DNB-AI-
Project emerging as the best-performing system in
qualitative evaluations. Here, precision reflected
true system performance, measuring the proportion
of predicted subjects marked correct by subject li-
brarians. Recall was adjusted to account for any
newly identified correct subjects not present in the
gold standard. DNB-AI-Project stood out for its
high precision among the top 20 recalled subjects,
employing a purely LLM-based approach with an
ensemble of LLMs and few-shot prompting, re-
quiring no fine-tuning. This supports the premise
of the shared task—assessing whether LLMs can
generalize effectively compared to traditional ma-
chine learning approaches that rely on extensive
fine-tuning.
Among the 14 evaluated domains,
Computer Science (inf) consistently had the high-
est average recall (Figure 4a), while Linguistics
(lin) and Literature Studies (lit) showed no predic-
tions from Homa and last_minute. Most teams
struggled with Engineering (tec) and Traffic Engi-
neering (ver) records, and Annif and DUTIR831
also exhibited low recall for History (his) and Eco-
nomics (oek). In contrast, the DNB-AI-Project and
RUC Team demonstrated consistent performance
across all domains. Finally, as shown in Figure 4b,
precision did not always align with recall rankings;
the Architecture (arc) domain, however, exhibited
the top 2 highest precision among all domains.
8
