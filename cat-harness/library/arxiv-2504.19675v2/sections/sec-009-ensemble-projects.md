---
doc_id: arxiv-2504.19675v2
doc_title: "Annif at SemEval-2025 Task 5: Traditional XMTC augmented by LLMs"
section_id: sec-009-ensemble-projects
section_title: "Ensemble projects"
section_number: null
pages: 3-4
source_pdf: 2504.19675v2.pdf
source_sha256: 5e8e75c26a95847b
toc_source: outline
---
We set up three kinds of ensemble projects that
combined the base projects in different ways: two
"BM" ensembles (simple and neural) combining
Bonsai and MLLM, and a "BMX" simple ensemble
that combines all three base projects (see Figure 2).
BM simple ensemble
BM neural ensemble
BMX simple ensemble
Bonsai
MLLM
XTransformer
ensemble/fusion projects
regular projects
trained on
runs
1,2,3
4,5,6
7,8,9
Figure 2: Overview of Annif projects and how they
were combined into ensembles.
We tuned the ensembles using the automated hy-
perparameter optimisation facility built into Annif
to select the weights used in averaging the results
of base projects. We used the annif hyperopt
command to try different combinations of weights
(100 tries for the BM ensembles and 200 tries for
the BMX ensembles), choosing weights that max-
imised the nDCG scores against the development
set (see Table 4 in Appendix C). In the BM ensem-
bles, the Bonsai model contributed 80–87% while
MLLM had a minor role. In the BMX ensembles,
the Bonsai model was still the most important at
8https://github.com/NatLibFi/
Annif-LLMs4Subjects/blob/main/projects.toml
47–62%; XTransformer contributed 21–33% while
MLLM again had a minor role. These optimised
weights match the relative order of the evaluation
of the individual base projects, where Bonsai ob-
tained the best results, followed by XTransformer
and MLLM. Omikuji Bonsai and XTransformer
are both similar models in the sense that they learn
to recognise each subject individually based on the
training data, but they are not good at suggesting
concepts which occur with a low frequency. In the
ensembles, MLLM complements these models by
being able to suggest any subject in the GND vocab-
ulary as long as the term used in the text matches
the preferred or alternate label in the vocabulary.
We reused the optimised weights of the BM sim-
ple ensembles also for the corresponding BM neu-
ral ensembles and trained them for 10 epochs using
records from the development set. The other NN
ensemble hyperparameters were left at their default
values.
The results of evaluating the ensembles against
the development set are in Table 1. Since the BM
neural ensembles were also trained on the devel-
opment set records, their evaluation results were
unrealistically good. As we had not set aside any
other records for this purpose, we had to wait for
the official evaluation results to assess their quality.
4.4
