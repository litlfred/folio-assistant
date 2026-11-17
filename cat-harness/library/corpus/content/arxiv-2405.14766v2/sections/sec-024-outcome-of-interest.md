---
doc_id: arxiv-2405.14766v2
doc_title: "Evaluating Large Language Models for Public Health Classification and Extraction Tasks"
section_id: sec-024-outcome-of-interest
section_title: "Outcome of Interest"
section_number: null
pages: 29-29
source_pdf: arxiv-2405.14766v2.pdf
source_sha256: 07248c8e1578d9ea
toc_source: outline
---
The appropriate methodology for domain specific evaluations is also strongly influenced
by the exact outcome researchers are interested in assessing. For NLU tasks, the potential
outcomes of interest can range from those focused on test set performance (e.g accuracy),
which we look at in this paper, to broader considerations such as bias and robustness.
For automated evaluations the literature largely uses performance metrics, with a particular
focus on F1 scores [68, 70, 30, 51, 28]. For specific tasks these high level metrics are often
supplemented with further class specific analysis [30].
Some of the other key outcomes of interest for fields such as public health are assessments
of software for bias and fairness, where this bias could be caused by bias in the LLM or
other places in the input data or software. General assessments of LLM bias are often carried
out during LLM training and benchmarking [45, 96, 97, 98, 99]. For specific NLU tasks,
further bias evaluations often involve analysing label specific results to identify whether
the predictions or errors deviate significantly based on individual characteristics or group
characteristics [100, 15, 101].
Evaluating bias and fairness is crucial for understanding the potential risks when deploying
LLMs for real-world use cases, particularly those that involve text about certain communities.
In a UK context, protected characteristics are enshrined in law as characteristics on which
people cannot be discriminated against [102]. Specifically for public health, evaluations
may also need to consider wider health equity frameworks, such as CORE20PLUS [103].
Evaluations of bias and fairness can generally be most effectively carried out using the
contents of the free-text (focusing on the specific protected characteristics that are relevant),
task (assessing the risk of bias in the output), and deployment process (evaluating the software
as a whole and how a human expert in the loop could mitigate or perpetuate risks) that would
be used in production.
6.1.4
