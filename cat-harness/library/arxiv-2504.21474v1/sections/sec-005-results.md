---
doc_id: arxiv-2504.21474v1
doc_title: "Homa at SemEval-2025 Task 5: Aligning Librarian Records with OntoAligner for Subject Tagging"
section_id: sec-005-results
section_title: "Results"
section_number: null
pages: 3-5
source_pdf: 2504.21474v1.pdf
source_sha256: 68a09fcd43927e7a
toc_source: outline
---
TIB-Core
2.84
20.30
4.66
Qualitative Results
Case 1
22.99
27.20
23.54
Case 2
14.02
23.39
16.33
Table 2: Quantitative and Qualitative results on TIB-
Core-Subjects sets. The averaged metrics are reported.
the model to improve retrieval performance.
Supervised Fine-Tuning of LLM. We followed
a similar process as the retriever model fine-
tuning, constructing the fine-tuning dataset with
a limit of 200 pairs per record.
This resulted
in a total of 12,348 samples for supervised fine-
tuning (SFT). Later, we fine-tuned a Qwen2.5-
0.5B-Instruct LLM using QLoRA-based (Dettmers
et al., 2023) SFT to adapt it for a classification
task. The training involved processing the dataset
into prompt-based inputs (we used the same as
OntoAligner prompts described by Babaei Giglou
et al. (2025)), where the model was tasked with
determining whether the title and subject tag are
match or not. The model was trained over 10
epochs using a batch size of 8, leveraging the Paged
AdamW optimizer (Loshchilov and Hutter, 2017)
with 8-bit precision for better computational effi-
ciency. The fine-tuned model was then saved for
further evaluation using the OntoAligner pipeline.
4
Results
4.1
Dataset
For evaluations, we use the TIB-Core-Subjects
dataset, which comprises 15,263 technical records
across five categories: Article, Book, Conference,
Report, and Thesis, in both English and Ger-
man. Language distribution includes 8,195 English
records and 7,113 German records, ensuring a bal-
anced multilingual evaluation. The dataset is split
into 7,632 training samples, 3,728 test samples,
and 3,948 development samples.
4.2
Quantitative Results
The Figure 1 and Figure 2 provide a comprehensive
comparison of system performance across differ-
ent languages, record types, and top-k candidates
using quantitative metrics. Additionally, Table 2
summarizes the average precision, recall, and F1
scores for the quantitative results on the TIB-Core.
Recall Performance Across k Values. As we
can see within Figure 1, the recall@k curves show
5
10
15
20
30
2
4
6
8
10
12
Precision@k
EN (DEV)
5
10
15
20
30
0
1
2
3
4
5
DE (DEV)
5
10
15
20
25
30
5
10
15
20
25
30
EN (Test)
5
10
15
20
25
30
0
5
10
15
20
DE (Test)
5
10
15
20
30
10
20
30
40
50
60
Recall@k
5
10
15
20
30
0.0
2.5
5.0
7.5
10.0
12.5
15.0
5
10
15
20
25
30
20
30
40
50
5
10
15
20
25
30
0
10
20
30
40
50
5
10
15
20
30
2
4
6
8
10
12
14
F1-score@k
5
10
15
20
30
0
1
2
3
4
5
5
10
15
20
25
30
5
10
15
20
25
30
5
10
15
20
25
30
0
5
10
15
20
25
Article
Book
Conference
Report
Thesis
Figure 1: Results for development and test sets per language and record types.
5
10
15
20
25
30
35
40
45
50
Precision @ K
5
10
15
20
25
30
35
40
45
50
Recall @ K
5
10
15
20
25
30
35
40
45
50
F1 @ K
Other teams
Our team
Figure 2: All the participant results on the test set.
a steady increase as k increases, with a notable
jump beyond k=15. This pattern suggests that
while initial ranked results contain relevant sub-
jects, broader subject coverage improves at higher
k values. The German language recall scores re-
main lower than English, likely due to richer train-
ing data or better linguistic resources embedded
within LLMs.
Precision Trends Across Languages. The Preci-
sion@k at Figure 1 indicate that English consis-
tently outperforms German across both the devel-
opment and test sets. The English dev and test
curves show higher precision values at all k val-
ues compared to their German counterparts. This
suggests that the subject alignment model is more
effective in English, reinforcing the earlier obser-
vation of language-based performance differences.
F1 Balance Between Precision and Recall. F1@k
in Figure 1 demonstrates a balanced trade-off be-
tween precision and recall. The scores peak around
k=15–20 before stabilizing, indicating an optimal
range where subject retrieval achieves a balance be-
tween accuracy and comprehensiveness. Beyond
k=20, recall gains do not significantly contribute
to F1-score, meaning additional retrieved subjects
may include more noise.
Performance Variation by Record Type. The
Figure 1 shows that, among record types, Articles
and Books show higher scores across all metrics,
suggesting that these records have clearer subject
assignments. In contrast, Conference and Reports
records exhibit lower performance, likely due to
ambiguous or overlapping subjects. This indicates
a need for refined retrieval strategies for these doc-
ument types and re-checking the ground truths for
more clarity.
Impact of k Selection on Model Performance.
The choice of k significantly impacts retrieval ef-
fectiveness. According to the Figure 2 and Fig-
ure 1, while lower k values (e.g., k=5) yield higher
precision, increasing k enhances recall but at the
cost of precision. The optimal balance is observed
between k=15 and k=20, where models maintain
strong performance without excessive subject list
expansion. Furthermore, the distribution analysis
of the number of subjects across both languages in
Article
Book
Conference
Report
Thesis
0
5
10
15
20
25
Language
en
de
Figure 3: Distribution of number of subjects across
categories using combined train and dev sets
arc
che
elt
fer
his
inf
lin
lit
mat
oek
phy
sow
tec
ver
Subject Classifications
0
10
20
30
40
50
Recall (%)
33.2%
29.0%
32.4%
30.5%
27.9%
24.1%
42.5%
28.5%
30.4%
24.9%
49.9%50.0%
20.8%
15.1%
29.8%
23.8%
21.1%
13.4%
22.6%
20.3%
45.5%
34.7%
24.6%
18.9%
Case 1
Case 2
