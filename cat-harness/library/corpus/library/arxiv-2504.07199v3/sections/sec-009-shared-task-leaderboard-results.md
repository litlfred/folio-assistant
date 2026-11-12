---
doc_id: arxiv-2504.07199v3
doc_title: "Tagging for a National Technical Library’s Open-Access Catalog"
section_id: sec-009-shared-task-leaderboard-results
section_title: "Shared Task Leaderboard Results"
section_number: null
pages: 8-8
source_pdf: 2504.07199v3.pdf
source_sha256: a6c42fa7f3f5183f
toc_source: outline
---
In this shared task, we provided two leaderboards:
1) quantitative results and 2) qualitative results.
Quantitative Metrics. System performance was
evaluated using average precision@k, recall@k,
and F1-score@k at multiple cutoffs (k = 5, 10,
15, ..., 50). These metrics were chosen as sub-
ject tagging was treated as a bag-of-words among
applicable subjects, making precision, recall, and
F1-score more suitable. Given the dataset struc-
ture of the LLMs4Subjects shared task, evaluation
scores were released at varying levels of granular-
ity: (1) language-level, separately for en and de, (2)
record-level, across five types of technical records,
and (3) combined language and record-levels, of-
fering a comprehensive performance breakdown.
This approach provided deeper insights into system
performance and facilitated detailed discussions in
the task overview and system description papers.
To ensure transparency, the shared task evaluation
script was publicly released.10
Qualitative Metrics. To assess system-generated
results in real-world scenarios, a qualitative evalua-
tion was conducted over three weeks. TIB subject
specialists manually reviewed 122 test records com-
mon to both all-subjects and tib-core, sampling 10
records from each of 14 subject classifications. The
top 20 GND codes from teams’ submissions were
extracted, and subject librarians labeled them as Y
(correct), I (irrelevant but technically correct), or
N/Blank (incorrect). Two evaluation criteria were
used: case 1 - treating both Y and I as correct, and
case 2 - considering only Y. Results were summa-
rized using average P@20, R@20, and F1@20.
Detailed results leaderboards are released on the
shared task website.11
7.1
