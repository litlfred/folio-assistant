---
doc_id: arxiv-2106.12880v1
doc_title: "T OWARDS M EASURING AND Q UANTIFYING THE C OMPREHENSIBILITY OF P ROCESS M ODELS - T HE P ROCESS M ODEL C OMPREHENSION F RAMEWORK"
section_id: sec-006-4-implementation-of-the-process-model-comprehens
section_title: "Implementation of the Process Model Comprehension Framework"
section_number: 4
pages: 8-10
source_pdf: 2106.12880v1.pdf
source_sha256: ebbd7354915d3b2a
toc_source: outline
---
Implementation of the Process Model Comprehension Framework
This section presents how the PMCF is implemented in order to measure and quantify process model comprehension.
For this purpose, the ETT has been implemented in a Microsoft Excel workbook template (see Appendix B). According
to the Communication Theory, this workbook is used to evaluate process models regarding their comprehensibility to
unravel noise between the communication of process modelers and readers. Note that the workbook consists of nine
sheets:
1⃝Conﬁguration
2⃝Process Modeling Language Complexity
3⃝Supported Patterns
4⃝Quality Metrics
5⃝Questionnaire for Process Modeler
6⃝Questionnaire for Process Reader
7⃝Perspective of Process Modeler
8⃝Perspective of Process Reader
9⃝Summary
The workbook supports the evaluation of process models expressed in terms of the following process modeling
languages: Business Process Modeling and Notation (BPMN) 2.0, Event-driven Process Chains (EPCs), and UML
Activity Diagrams. Since the relevant sheets are predeﬁned with the results obtained from the survey (i.e., weighting of
the quality criteria and metrics), only the sheets (4), (5), and (6) must be completed to quantify the perspectives (i.e.,
process modeler, reader, and both) in the context of process model comprehension. Changes in the remaining sheets are
only necessary if factors (e.g., weighting factor wk) shall be adjusted, further quality criteria and metrics need to be
introduced, or the workbook shall be extended to support additional modeling languages. Regarding the latter, in all
sheets, respective information for the newly introduced modeling language must be added.
(1) Conﬁguration: Process modeling languages have various impact on process model comprehension (e.g., in terms
of expressiveness) [6]. Thus, the operationalization thereof is performed in the workbook in (2). Moreover, with respect
to comparability, all results in the workbook are normalized within an interval between [1, 10]. Thereby, a 1 represents a
worse outcome, whereas a 10 indicates the best outcome regarding process model comprehension. Hence, in this sheet,
the complexity coefﬁcient ∥Ci∥calculated in (2) (see Equation (5)) is normalized to ¯Ci for each process modeling
language within an interval between [1, 10], and is deﬁned as follows:
¯Ci = 10 −(10 ∗∥Ci∥) −∥Ci∥
MAX(Cn) ∗10 ,
(3)
where i is the process modeling language, ∥Ci∥is the complexity score for the speciﬁc process modeling language i,
and Cn is the set of all complexity scores.
Another factor having an impact on process model comprehension is the use of workﬂow patterns in a process model.
These patterns play a crucial role in the creation of such models and are, therefore, especially for process modelers of
importance [35]. The impact of workﬂow patterns, (i.e., Pi calculated in (3), currently just for control ﬂow patterns) is
shown in this sheet and is included in the determination of the process model comprehension score for the perspective
of process modelers (see (7)).
(2) Process Modeling Language Complexity: In general, a process modeling language is composed of a number of
modeling elements, their characteristics (e.g., different activity types), and their relations (e.g., different ﬂow types such
as sequence or data), which deﬁne the expressiveness of respective language [36]. Based on this consideration, the
workbook deﬁnes the complexity of a process modeling language Ci as a three-dimensional vector:
Ci = (xi, yi, zi),
(4)
8
Process Model Comprehension Framework
where i is the process modeling language, xi is the number of elements of the modeling language, yi is the number of
characteristics per element, and zi is the number of relationships per element [37].
Accordingly, the number of elements, their characteristics as well as their relations reﬂect the complexity of a modeling
language. With the Euclidean norm, Ci can be converted to the complexity score ∥Ci∥for a speciﬁc process modeling
language i:
∥Ci∥=
q
x2
i + y2
i + z2
i
(5)
(3) Supported Patterns: The expressiveness as well as suitability of a process modeling language is not only determined
by the number of elements, their characteristics, and their relations (see (2)), but also by the number of supported
workﬂow patterns [35]. Workﬂow patterns describe speciﬁc mechanisms supporting stakeholders dealing with the
complexity of process models (e.g., consideration of different perspectives such as control ﬂow and data). For this
reason, [38] deﬁned a set of workﬂow patterns, which are considered in the workbook. In this context, the workbook
supports the following workﬂow pattern types: control ﬂow, data, and resource patterns. Furthermore, for each workﬂow
pattern type, the workbook considers which workﬂow patterns are fully, partially, or not supported in the respective
modeling language. Based on this consideration, the score for supported patterns Pi is determined as follows:
Pi = mi + ni + oi,
(6)
where i is the process modeling language, mi is the number of fully and partially supported control ﬂow patterns, ni is
the number of fully and partially supported data patterns, and oi is the number of fully and partially supported resource
patterns.
Pi (in percentage, currently just for control ﬂows patterns) is used in (1) for the determination of the process model
comprehension score pertaining to the perspective of process modelers (see (7)).
(4) Quality Metrics: In this sheet, for the perspective of process modelers and readers, the quality metrics from the
PMCF (i.e., ETT) related to the evaluated process model are determined. In particular, for each quality metric, an
explanation of the respective metric is given as well as an instruction on how to determine the corresponding metric
(e.g., number of in-/outgoing edges per process modeling element). The metrics are determined either as described in
respective literature or must be determined manually considering the process model to be evaluated. If the determined
result has not yet been normalized, the result will be normalized in an additional step within an interval between [1, 10].
Thereby, a result towards the right boundary (i.e., 10) describes a more positive impact on the comprehension of the
process model.
(5) Questionnaire for Process Modeler: The comprehension of a process model depends not only on factors of the
respective process model (e.g., size of the process model), but also on the perception of the original creator (i.e.,
process modeler) of the model. Thereby, a process modeler has personal related characteristics (e.g., expertise in
process modeling) in the context of process modeling as well as an individual interpretation about the information and
knowledge regarding the process and its related model. Furthermore, there exist a speciﬁc mental interpretation about
the process and resulting process model in the mind of the process modeler. As described in Section 2.1, noise may
occur in the communication of process information and knowledge between the process modeler as well as readers.
For this reason, it is important to capture and know both personal related characteristics as well as the interpretation
of the process modeler (i.e., perspective of process modelers) to identify respective noise and to initiate countersteps.
Therefore, the original process modeler of a corresponding model has to answer a speciﬁc questionnaire capturing
personal related characteristics as well as the related interpretation of the process and its resulting process model. The
questionnaire consists of a set of 49 different questions addressing quality criteria and metrics from the ETT to capture
the perspective of the process modeler. The questions types are a set of true-or-false and Likert scale questions. The
responses are compiled to a score within the interval [1, 10], whereas ten indicates a more positive impact on process
model comprehension.
(6) Questionnaire for Process Reader: Similar to the process modeler, a speciﬁc questionnaire to capture the
perspective of process readers has to be answered. This questionnaire consists of 24 questions related to corresponding
quality criteria as well as metrics from the ETT in order to gather the perception and interpretation of process readers
about the comprehended process model. Equally to (5), the responses reﬂect a score within the interval [1, 10], whereas
ten constitutes the best score regarding process model comprehension.
(7) Perspective of Process Modeler: This sheet contains all the ranked as well as weighted quality criteria and
corresponding metrics from the ETT for process modelers. The individual scores are automatically generated based on
the results obtained from the sheets (1), (4), and (5). Hence, this sheet requires no interaction and is used exclusively
9
Process Model Comprehension Framework
for aggregating and calculating the process model comprehension score for process modelers. Therefore, as a ﬁrst step,
the sum of all quality metrics Qc of the respective criterion is calculated:
Qc =
n
X
i=1
i,
(7)
where c is the quality criterion, i is the quality metric, and n is the number of quality metrics.
The ﬁnal process model comprehension score for process modelers Sm, which represents a score within the interval
[1, 10] (i.e., ten is the best), is built from the sum of all aggregated quality criterion Qc:
Sm =
6
X
c=1
= Qc
(8)
Based on Qc, possible factors for noise can be identiﬁed by considering related quality metrics with a score towards the
left boundary within the interval [1, 10] (see Section 5).
(8) Perspective of Process Reader: Similar to (7), the process model comprehension score for process readers Sr is
determined in this sheet. Hence, all ranked as well as weighted quality criteria and corresponding metrics from the ETT
are shown here. The determination of the score is carried out in the same way as described in (7), only with relevant
aspects for process readers. Therefore, no changes are required in this sheet. The process model comprehension score
for process readers reﬂects a score within the interval [1, 10] (i.e., ten is the best), based on the sum of the aggregated
quality criteria for process readers. As with the process modeler, factors for noise in the comprehension of a process
model can be identiﬁed on the basis of the individual calculated scores for respective quality criterion and related
metrics (see Section 5).
(9) Summary: The ﬁnal sheet in the workbook presents the quantiﬁed process model comprehension scores on the
evaluated process model. Here, the scores for the perspective of process modelers Sm and readers Sr as well as the
interaction of both Sb are presented. The single scores are within the interval [1, 10], whereas 1 indicates the worst
score regarding process model comprehension and 10 the best. Thereby, the scores for process modelers and readers are
determined in the sheets (7) and (8), respectively. The score for the interaction of both perspectives Sb is determined as
follows:
Sb = (wm ∗Sm) + (wr ∗Sr),
(9)
where wm is the weight for process modelers and wr is the weight for process readers.
The two weights wm and wr were determined within the survey with the speciﬁc question asking about which aspect in
a process model is considered to be more signiﬁcant, i.e., ease of creation (wm) or ensuring proper comprehensibility
(wr). Hence, the percentage distribution was calculated from the responses given.
