---
doc_id: arxiv-2106.12880v1
doc_title: "T OWARDS M EASURING AND Q UANTIFYING THE C OMPREHENSIBILITY OF P ROCESS M ODELS - T HE P ROCESS M ODEL C OMPREHENSION F RAMEWORK"
section_id: sec-005-31-evaluation-theory-tree-ett
section_title: "Evaluation Theory Tree (ETT)"
section_number: 3.1
pages: 5-8
source_pdf: 2106.12880v1.pdf
source_sha256: ebbd7354915d3b2a
toc_source: outline
---
Evaluation Theory Tree (ETT)
Based on the fundamentals discussed, an Evaluation Theory Tree (ETT) was deﬁned [30]. In general, the ETT represents
a convolution of the PMCF. Hence, the roots of the ETT consider the perspectives of the process modelers and readers.
The reason for two roots in the ETT is due to the fact that aspects exist that cannot be mapped directly between both
perspectives. For example, the creation of a process model is only relevant for process modelers. Therefore, process
modelers and readers must be considered separately. Each perspective, in turn, consists of a number of aggregated
quality criteria in the context of process model comprehension. These quality criteria are related to the eight quality
dimensions from the PMCF (see Figure 4). Furthermore, the quality criteria and metrics were obtained from existing
literature in a related review as well as from conducted interviews with domain experts from the ﬁeld of BPM.
Literature review: In literature, there exists numerous works focusing on process model quality in order to, on one the
hand, improve the creation and, on the other hand, to foster the comprehension of process models [9, 31]. Moreover,
different frameworks as well as guidelines with an emphasis on process model quality were deﬁned for this context
as well (see Section 1). Regarding the PMCF, several data sources and publication libraries (e.g., Google Scholar,
SpringerLink, IEEE Xplore Digital Library) were examined for works concerning process model quality during process
5
Process Model Comprehension Framework
Figure 4: Process Model Comprehension Framework (PMCF)
model creation and comprehension. Therefore, search strings were elaborated with the combinations of keywords
derived from our knowledge of the subject focus (e.g., process model quality).
Interviews: In the conducted interviews, eight domain experts (i.e., from academia and industry) with many years of
expertise in the ﬁeld of BPM were personally consulted. The used catalog of questions contained a set of opinion (e.g.,
Which quality aspects in a process model are essential in the creation of a complete and correct process documentation,
but also to ensure that the created model can be comprehended by all involved stakeholders?), behavioral (e.g., How
can it be avoided that a process modeler creates an incorrect model?), and competency (e.g., When does the application
of a process modeling language or the creation/comprehension of a process model become too complex?) questions in
terms of preservation of quality in process modeling as well as process model comprehension. From the given answers
of the interviewed domain experts, quality criteria and metrics were identiﬁed referring on the perspective of process
modelers, readers, and synergies covering both perspectives.
The categorization of the quality criteria and corresponding metrics were done within a consensus decision-making
process, involving participants from industry and academia as well as obtained insights from the literature review,
including the interviews.
As a result, the perspective of process modeler comprises the following six main quality criteria:
• Process Modeling Language: This criterion covers crucial aspects (e.g., workﬂow patterns) that a process
model language should support for the creation of high quality process models.
• Process Modeling Tool: The quality of created process models are dependent of the used process modeling tool.
Hence, this criterion summarizes vital aspects (e.g., process views) about tool-support in process modeling.
• Information: This criterion is concerned with process information retrieval and addresses aspects like correct-
ness and completeness of process information.
• Errors: Semantic (e.g., logical errors) and syntactic (e.g., errors in modeling conventions) errors in a process
model are subject of this criterion.
• Person: Person-related characteristics (e.g., process modeling experience) are considered in this criterion.
• Process Modeling Guidelines: This criterion covers guidelines and rules (i.e., from enterprise and academic)
that were deﬁned in order to create process models of high quality.
These quality criteria are subdivided into several sub-metrics, resulting in 54 different quality metrics.
Regarding the perspective of process reader, 42 quality metrics are summarized in a total of seven main quality criteria,
which are deﬁned as follows:
• Process Modeling Language: This criterion addresses aspects (e.g., modeling language complexity) that deﬁne
comprehensible process modeling language.
• Medium: The subject of this criterion is the question with which medium (e.g., paper-based) is the process
model comprehended.
• Information: This criterion deals about which kind of process information (e.g., process participants) are
included in the process model.
6
Process Model Comprehension Framework
• Person: Person-related characteristics (e.g., process modeling experience) are considered in this criterion.
• Level of Detail: In this criterion, the level of detail (e.g., abstract or concrete) of the comprehended process
model is addressed.
• Representation Factors: Aspects about the process model representation (e.g., number of elements) and the
model structure (e.g., block structure) are subject of this criterion.
• Comprehension Questions: Process model comprehension performance analysis (e.g., comprehension ques-
tions) are considered in this criterion.
Altogether, the ETT contains 96 quality metrics. Each of the 96 metrics can be assigned to one or more quality types in
the PMCF (e.g., learnability of a modeling language refers to K1 in Figure 4). Further, the evaluation of the quality
types facilitates the identiﬁcation of noise (e.g., difference in process model knowledge) between process modelers and
readers as known from the PMCF. Due to space limitations, Figure 5 only presents an excerpt of the ETT (see Appendix
A).
Figure 5: Excerpt from the ETT
In order to measure and quantify process model comprehension, the importance and the impact on process model
comprehension for each quality criterion and its related metric in the ETT had to be determined. For example, as
shown in [32], the number of elements in a process model constitutes a more critical factor having a stronger impact on
process model comprehension juxtaposed to the labeling of process model elements. For this reason, a survey with 131
participants from academia as well as industry was conducted. The participants of the survey were asked to rate and
place the quality criteria as well as related metrics for both considered perspectives (i.e., process modeler and reader) in
an order from important to unimportant to determine the rank and the impact of each quality criterion and metric. For
the determination of the rank, the results were analyzed with the weighted arithmetic mean ¯X that is deﬁned as follows:
¯X =
Pn
k=1 wkpi,k
Pn
k=1 wk
,
(1)
where k is the rank, n is the number of ranks, wk is the weighting factor for the rank k, i is the quality metric, and pi,k
is the percentage choice of the quality metric i on the rank k.
The weighting factor wk had to be determined, since each quality criterion and related metric exert a different impact
on process model comprehension. For the calculation of the weighting factor wk, the following evaluation methods
for information retrieval were juxtaposed in a series of repeated measurements: Rank Sum, Reciprocal Rank, Rank
Exponent, Discounted Cumulative Gain, and Distance Normalized Logarithm [33]. Most considered methods showed
a disparate differentiation between the quality criteria and metrics (i.e., Rank Sum, Rank Exponent, Discounted
Cumulative Gain). Moreover, the methods presented no standardized distance between the highest and the lowest rank
as well the ranks in between. In more detail, the provided weighting factors of those methods exhibited a limited growth
leading to an incorrect differentiation of the quality criteria and metrics. However, further analyses demonstrated that
a cubic (i.e., Reciprocal Rank) or an exponential growth (i.e., Distance Normalized Logarithm (DNLog)) should be
considered in this context. A comparison of both methods revealed that the DNLog was more suitable for our purpose.
The reason for this decision was that the DNLog ensures a more detailed weighting of the quality criteria as well as
metrics. For example, a vital criterion or metric (e.g., syntactical process model correctness [34]) has a more signiﬁcant
impact on process model comprehension and should be given a greater weight compared to negligible ones (e.g., avoid
7
Process Model Comprehension Framework
OR routing process model elements [16]). As a result, the DNLog was chosen for the calculation of the weighting
factor wk, which is deﬁned as:
wk = 10(n−k) log10(d)
(n−1) ,
(2)
where n is the number of items, k is the rank, and d is the score in the survey.
Equations (1) and (2) were used to analyze the responses from the 131 participants of the survey and to determine the
rank as well as the impact of all quality criteria and related metrics on process model comprehension for the perspective
of process modelers, readers, and the interaction between both perspectives.
