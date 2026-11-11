---
doc_id: arxiv-2504.07199v3
doc_title: "Tagging for a National Technical Library’s Open-Access Catalog"
section_id: sec-010-quantitative-evaluations
section_title: "Quantitative Evaluations"
section_number: null
pages: 8-8
source_pdf: 2504.07199v3.pdf
source_sha256: a6c42fa7f3f5183f
toc_source: outline
---
The primary evaluation metric was recall, with the
overall leaderboard ranking based on average recall
scores across k values from 5 to 50. For practical
use by subject specialists, systems should predict
relevant subjects at lower k values, ideally between
5 and 10, with a maximum of 20. Table 3 presents
the results for both collections: all-subjects and
tib-core. The top teams consistently predicted over
half of the subject annotations in both collections.
10https://github.com/jd-coderepos/
llms4subjects/blob/main/shared-task-eval-script/
llms4subjects-evaluation.py
11https://sites.google.com/view/llms4subjects/
team-results-leaderboard
A caveat here is that our precision score would
never amount to one and heavily penalizes actual
system performance.12 Despite this, they were in-
cluded to provide a comparison. The top three
teams based on average recall for all-subjects were
Annif, DUTIR831, and RUC Team, while for tib-
core, the top three were RUC Team, Annif, and
LA2I2F. Notably, the top-performing teams on all-
subjects maintained strong rankings on tib-core,
with DUTIR831 placing fourth. LA2I2F, ranking
third on tib-core, appeared more effective on the
smaller subjects taxonomy of tib-core.
At the record-type level (Figure 1a), most sys-
tems achieved high recall@5 for articles in both
collections, while books, conference papers, and re-
ports showed similar performance. The weakest re-
sults were observed for theses. For the top teams on
all-subjects (Annif, DUTIR831, and RUC Team),
precision scores across record types were similar
(Figure 1b). RUC Team demonstrated consistently
high precision on articles in both collections. On
tib-core, LA2I2F’s boost to third place stemmed
from its high precision on articles—second only
to RUC—despite comparable recall scores to other
teams. At the language level, results from both re-
call (Figure 2a) and precision (Figure 2b) showed
no significant difference between processing de or
en records across all teams. The only consistent
variation was that RUC Team performed slightly
better on de records, while LA2I2F for en records.
7.2
