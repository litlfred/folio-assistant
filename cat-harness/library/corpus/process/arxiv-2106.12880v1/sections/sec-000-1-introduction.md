---
doc_id: arxiv-2106.12880v1
doc_title: "T OWARDS M EASURING AND Q UANTIFYING THE C OMPREHENSIBILITY OF P ROCESS M ODELS - T HE P ROCESS M ODEL C OMPREHENSION F RAMEWORK"
section_id: sec-000-1-introduction
section_title: "Introduction"
section_number: 1
pages: 1-3
source_pdf: 2106.12880v1.pdf
source_sha256: ebbd7354915d3b2a
toc_source: outline
---
Introduction
Business Process Management (BPM) describes the discipline in bridging the gap between business, technology, and
human workers in organizations [1]. In more detail, modern information technologies (e.g., process-aware information
systems; PAIS) are the enabler towards the automation of the processes in organizations and comprising the interaction
between humans and the application of technology (i.e., human-driven processes) [2]. As a prerequisite for the
successful utilization of PAIS, it must be ensured that the numerous processes of organizations are comprehended
correctly and that respective information as well as knowledge about these processes are proper documented; either
textually or visually [3]. Thereby, in order to sustain competitive advantage, an easy to comprehend and correct
documentation of process information and knowledge is essential [4]. In this context, an established approach to
document process information and knowledge is to rely on the technique of process modeling, in which respective
arXiv:2106.12880v1  [cs.SE]  24 Jun 2021
Process Model Comprehension Framework
information as well as knowledge are visually documented in process models. More speciﬁcally, process models
summarize the individual processes of organizations with their logical sequence of activities and functions, together
with involved stakeholders or exchanged data. For this reason, one of the main purposes of process models is to
communicate information and knowledge about corresponding processes. As a result, process models should be created
in a way that involved stakeholders do not encounter any challenges in the comprehension of such models in order to
take full advantage of their beneﬁts [5].
In general, all stakeholders involved in working with process models can be assigned into a group consisting of process
modelers, process readers, or a combination of both [6]. Initially, a process modeler consolidates required information
and knowledge about a process and, hence, creates a corresponding process model based on it. Thereby, the process
modeler should be aware that the created process model reﬂects a high model quality in order to ensure a proper process
model comprehension [7]. Accordingly, with the assistance of the created process model, process readers are able
to extract information as well as knowledge about related processes. However, a process model of high quality that
is comprehensible for the initial model creator does not ensure that even a process reader is able to comprehend the
same model [8]. Usually, the two major reasons for this are, on one the hand, that there exists a gap of experience
and expectations (i.e., different perspectives) in working with process models [9]. On the other hand, pitfalls (e.g.,
modeling errors) in the communication of process knowledge as well as information between process modelers and
readers describe another reason [10]. To tackle these issues, speciﬁc guidelines and frameworks in literature exist
putting an emphasis on quality aspects (e.g., consistency in process models) to foster the comprehension of conceptual
as well as process models. For example, one of the most inﬂuential frameworks for conceptual modeling constitutes the
SEQUAL framework introduced in [11]. This framework considers three different quality dimensions (i.e., syntactic,
semantic, and pragmatic quality) and provides means of improvement for each quality dimensions in order to maintain
a high quality in conceptual models, thus having a positive inﬂuence on the comprehension of such models. Further, the
authors in [12] are addressing shortcomings (e.g., static view upon semantic quality) of the SEQUAL framework and
propose an adjusted framework. In addition, a signiﬁcant enhancement of this work describes the consideration of as-is
as well as to-be states (i.e., domain and knowledge). Based on semiotics, an integrative framework for information
systems is discussed in [13]. Thereby, the authors consider the interaction of three worlds (i.e., material, personal, and
social) derived from Sociomateriality Theory and use this kind of interaction to discuss deﬁcits and improvements in
model comprehension. Another framework for the evaluation of the quality and comprehension in conceptual models
constitutes the Bung-Wand-Weber (BWW) framework [14]. It comprises metrics to evaluate the quality in conceptual
models. Thereby, a focus is set on the modeling process and the BWW framework considers how objects from the
real world change during the transformation into a conceptual model and the impact on the model quality as well as
comprehension during this transformation. Moreover, the Guidelines of Modeling (GoM) describe another framework
to measure the quality in process models from different viewpoints in order to foster model comprehension [15]. In
this context, the work presented in [16] describes a set of seven process modeling guidelines (7PMG) assisting process
modelers in the creation of comprehensible models. Finally, the work presented in [17] introduces the Comprehensive
Process Model Quality Framework (CPMQF). The CPMQF summarizes existing knowledge about process model
quality and structures related knowledge based on six key questions, with an emphasis on completeness and relevance
of quality aspects in process models. However, all discussed works are mainly on a theoretical basis and none provides
an applicable measurement and the quantiﬁcation of the perspectives of process modelers and readers in process
model comprehension. As a consequence, the identiﬁcation of aspects in a process model that are hard to comprehend
(i.e., noise) is still tedious, because the results presented in the discussed works might be too abstract (i.e., no clear
directional guidance for process model improvement). In addition, especially novices or non-experts may ﬁnd it difﬁcult
to recognize their beneﬁts in the context of process model comprehension.
For this reason, in line with prior conducted research and as a further contribution to improve our understanding of
working with process models, we try to foster process model comprehension with an approach that recapitulates and
quantiﬁes the speciﬁc perspectives of process modelers and readers as well as the interaction between both groups
as main determinants in model comprehension. Therefore, this paper presents the Process Model Comprehension
Framework (PMCF). The PMCF describes the ﬁrst step towards a framework to measure the comprehensibility of
process models from the perspective of process modelers, readers, and the interaction of both. Therefore, in a consensus
building process with experts from BPM and existing literature, an Evaluation Theory Tree (ETT) with 96 quality
metrics was deﬁned. The ETT was evaluated in a survey with 131 students and practitioners to determine the importance
and degree of impact on process model comprehension of the quality criteria as well as metrics used in the ETT. In
conclusion, the PMCF quantiﬁes process model comprehension on evaluated process models taking both the perspective
of process modelers and readers into account. To demonstrate the applicability of the PMCF, a case study with 33
participants from industry was conducted. In general, the PMCF shall unravel general pitfalls that needed to be addressed
in order to ensure a proper comprehension of process models. Furthermore, a uniform model comprehensibility is
pursued with the application of the PMCF between process modelers and readers. In the future, the PMCF is intended
to provide additional assistance for organizations in the efﬁcient and effective utilization of information systems.
2
Process Model Comprehension Framework
