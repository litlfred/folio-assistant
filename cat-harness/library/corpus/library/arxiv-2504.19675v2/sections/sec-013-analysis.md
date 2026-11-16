---
doc_id: arxiv-2504.19675v2
doc_title: "Annif at SemEval-2025 Task 5: Traditional XMTC augmented by LLMs"
section_id: sec-013-analysis
section_title: "Analysis"
section_number: null
pages: 4-6
source_pdf: 2504.19675v2.pdf
source_sha256: 5e8e75c26a95847b
toc_source: outline
---
We trained parallel English and German versions of
each model, demonstrating successful LLM-based
translation of multilingual input data. In all but
development set
test set
Vocab
System
Run#
Ensemble
Lang
F1@5
nDCG@10
F1@5
Avg recall
Rank
all
Annif (ours)
1
BM simple
de
0.3174
0.5459
0.3108
0.5736
2
en
0.3312
0.5677
0.3184
0.5890
3
de+en
-
-
0.3376
0.6201
4
BM neural
de
0.3337*
0.5726*
0.3029
0.5447
5
en
0.3504*
0.6008*
0.3116
0.5599
6
de+en
-
-
0.3318
0.6005
7
BMX simple
de
0.3263
0.5614
0.3185
0.5859
8
en
0.3411
0.5842
0.3276
0.6038
9
de+en
-
-
0.3432
0.6295
1st
DUTIR831
3
0.3346
0.6045
2nd
RUC Team
1
0.3015
0.5856
3rd
DNB-AI-Project
1
0.3231
0.5631
4th
icip
1
0.2618
0.5302
5th
tib-core
Annif (ours)
1
BM simple
de
0.2821
0.5557
0.2796
0.5285
2
en
0.3009
0.5936
0.2984
0.5617
3
de+en
-
-
0.3113
0.5824
4
BM neural
de
0.3209*
0.6171*
0.2660
0.4864
5
en
0.3467*
0.6661*
0.2886
0.5217
6
de+en
-
-
0.3043
0.5559
7
BMX simple
de
0.2891
0.5684
0.2864
0.5385
8
en
0.3079
0.6051
0.3030
0.5719
9
de+en
-
-
0.3136
0.5899
2nd
RUC Team
1
0.3271
0.6568
1st
LA2I2F
2
0.2717
0.5794
3rd
DUTIR831
2
0.3153
0.5599
4th
icip
1
0.2370
0.4976
5th
Table 1: Quantitative evaluation results for the ensemble projects measured against the development and test sets.
Top 5 systems included for comparison. Note that Lang refers to the project language, not to the indicated language
of the records. *Unreliable score because the neural ensemble was trained on the development set it was evaluated on.
one case, the English variant achieved higher eval-
uation scores than its German counterpart. The
quality of LLM-produced translations can have an
effect on the quality of the indexing of the down-
stream subjects. It may be that the translations
were better in English or that the analytic structure
of the English language makes it easier to process
for traditional NLP pipelines than German, which
is more synthetic and has many compound words.
Further analysis of the effect of translation quality
on the quality of subject indexing is left for future
work.
By generating synthetic records, we were able to
mitigate the lack of sufficient training data required
by traditional ML algorithms. Thanks to this, the
nDCG scores of our Bonsai models increased by
~0.03 points (see Figure 3 in Appendix A).
The BMX ensembles consistently achieved
higher evaluation scores than the corresponding
BM ensembles, indicating that the addition of
XTransformer had a positive effect. The neural BM
ensembles achieved high evaluation scores against
the development sets, as expected, but underper-
formed in the evaluations on the test set. In our
experience, the neural ensemble is able to correct
bias in settings where some of the training data
are structurally different from the evaluation data.
However, in this task, both the training and eval-
uation data was structurally similar so there was
no need for such adjustment and the neural model
simply made the predictions worse.
We tested a new "multilingual ensemble" method
by generating predictions separately from German
and English variants of the same records and then
merging the subject predictions. The merged pre-
dictions achieved higher scores than the monolin-
gual predictions. Had we not done this, our best
runs would have been the BMX ensembles for En-
glish. In the quantitative evaluation, we would have
ranked 2nd after DUTIR831 in all-subjects and 3rd
after LA2I2F in tib-core-subjects.
Our system ranked 1st and 2nd in the quantitative
evaluations, but in the qualitative evaluations, three
other systems achieved higher scores. A possible
explanation for this difference is that our system,
based on traditional ML, was heavily guided by the
training data records. We were thus able to pro-
duce subject predictions quite similar to the exist-
ing TIBKAT subject metadata. Some other systems,
in contrast, produced predictions that were not as
similar to existing metadata, but were considered
qualitatively better by the evaluators. Assuming
that the other systems relied more on LLMs for
subject assignment than our system, they were not
as constrained by the available training data and
instead were able to leverage the knowledge of the
LLMs. None of the systems achieved a F1@5 score
above 0.35 in the quantitative evaluations, possi-
bly indicating a relative lack of consistency in the
TIBKAT subject metadata9.
Using different evaluation metrics for develop-
ment and test sets introduced unnecessary complex-
ity. In our opinion, the nDCG@50 metric would be
a good choice for ranking systems that were tasked
to produce 50 subject predictions per record.
6
