---
doc_id: arxiv-2405.14766v2
doc_title: "Evaluating Large Language Models for Public Health Classification and Extraction Tasks"
section_id: sec-023-level-of-generality
section_title: "Level of Generality"
section_number: null
pages: 27-29
source_pdf: arxiv-2405.14766v2.pdf
source_sha256: 07248c8e1578d9ea
toc_source: outline
---
6.1.1
Level of Generality
Domain specific evaluations often lie on a spectrum, from assessing the potential applicability
of an LLM for a domain in general (e.g Medicine [5]) to assessing an LLM on a single
specific task within a domain (e.g diagnosing neuro-ophthalmic diseases [71]).
General domain evaluations often draw on existing human assessments and exams. For
example, in Medicine using questions from (or in the style of) the US Medical Licensing
Examination (USMLE) [72, 73, 74, 75], in Law the US Bar Exam [76, 77], or using human
exams for given subjects [4, 78, 79, 80]. However, bespoke domain evaluations for LLMs
are increasingly being developed (often including aspects of the human assessments), such
as LawBench (Legal) [13], MultiMedQA (Medical) [74], FinBen (Financial) [12], the
Financial Language Understanding Evaluation (FLUE) benchmarks (Financial) [81], and
ChemLLMBench (Chemistry) [82].
In contrast, the more specific domain evaluations in the literature, which target either
sub-fields or specific tasks, have often involved collecting and manually annotating new
27
evaluation datasets (or modified / filtered existing domain specific data). In Medicine this has
commonly involved collecting data and evaluating LLMs for specific sub-fields, including,
Neuro-ophthalmology (diagnosis) [71], Bariatric surgery (QA) [17], Osteoarthritis (case
management) [83], Dementia (diagnosis) [84], and Genetics (QA) [85]. In Law, specific
evaluations have generally been carried out for given tasks or abilities, including, generating
explanations for legal terms [86], statutory reasoning [87], and legal entailment [88].
The chosen level of generality for an evaluation is primarily determined by the overall
aim. More general domain evaluations are most useful for understanding broad capabilities,
developing or fine-tuning new LLMs, and prioritising existing LLMs for further assessment.
More task specific domain evaluations are generally crucial when considering deploying
LLMs for real world use cases or applying LLMs to unseen datasets and tasks (such as
private organisational data).
6.1.2
Types of Task
In the literature, the approach adopted for a domain specific LLM evaluation is also signifi-
cantly influenced by the type of task (or tasks) involved. As discussed by Chang et al. [15],
a key factor is whether the task primarily involves classification or inference (Natural Lan-
guage Understanding - NLU) or whether it involves generating free text (Natural Language
Generation - NLG).
Evaluation of LLMs for tasks focusing on classification or the extraction of structured data
(NLU) utilises similar metrics and approaches to traditional data science. This involves
collecting a representative dataset of free text, annotating with ground truth labels, and then
evaluating the performance of the LLM using metrics such as accuracy, recall, precision, and
F1 scores [29, 28, 30].
In contrast, LLM tasks that generate unstructured free text (NLG), such as summarisation,
have been shown to be hard to evaluate with traditional automated methods [89, 90, 15, 91],
such as ROUGE [92]. This has led many NLG task evaluations to adopt human evaluation
approaches, particularly in domain specific or risk-averse fields, such as Medicine [74, 5,
93, 91]. This usually involves human experts reading the LLM outputs and scoring them on
absolute (rate out of 10) or relative (which response is better) metrics for a given criteria.
However, human evaluation of NLG tasks brings a number of challenges, including: (1) cost,
as expert annotation is time-consuming and experts’ time is valuable, (2) subjectivity, as
there may be inconsistency in annotations between experts, and (3) scalability, as human
evaluations must be repeated manually for every model (whereas annotated data can be
used to evaluate all models). These issues, combined with the increasing capabilities of the
state of the art LLMs, have led researchers to investigate replacing manual human review of
generation tasks, with automated review by different, usually more capable LLMs [16, 94, 95].
Whilst these approaches have seen some success [16, 95] it remains unclear which domains
or tasks LLMs are "qualified" to evaluate. This is a particular issue for risk-averse sectors
28
that involve specialised knowledge, such as public health.
6.1.3
