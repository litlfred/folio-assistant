---
doc_id: arxiv-2405.14766v2
doc_title: "Evaluating Large Language Models for Public Health Classification and Extraction Tasks"
section_id: sec-028-drug-and-intervention-extraction
section_title: "Drug and Intervention Extraction"
section_number: null
pages: 31-31
source_pdf: arxiv-2405.14766v2.pdf
source_sha256: 07248c8e1578d9ea
toc_source: outline
---
Extracting relevant Pharmaceutical interventions from free text is another common task in
public health free text processing.
D’Oosterlinck et al. [29] propose BioDEX, a dataset of PubMed articles about Adverse Drug
Events (ADE) and their corresponding ground truth ADE extractions. BioDEX is used to
evaluate GPT-3.5 and GPT-4 LLMs with few-shot prompting, this achieves an overall F1
score of approximately 0.5 at extracting the 4 core ADE report attributes (patient sex, serious
event, reactions and drugs), currently well below expert level. Due to the length of the papers
the few-shot prompts are constructed using abstracts, and the input paper is truncated to fit
the context window, potentially limiting the information available to the model.
Agrawal et al. [28] add new annotations to the Clinical Acronym Sense Inventory (CASI)
dataset [105] to evaluate GPT-3 for the task of extracting medical interventions from clinical
notes and medical acronym disambiguation. Combining GPT-3 with a resolver to form
structured outputs along with zero-shot and one-shot prompting is shown to have fairly
strong results across tasks, generally achieving F1 scores >0.6. However, as in other studies,
the authors note the difficulty of generating exact matches for complex ground truth labels.
Similarly, Bisercic et al. [69] evaluate InstructGPT for the task of generating structured
JSON data from medical reports within their TEMED-LLM approach. Using medical reports
on patient treatments, psychologist notes, strokes, hepatitis, and heart disease, InstructGPT
with one-shot and CoT prompting combined with additional output validation (e.g correcting
JSON formatting errors) achieves over 90% accuracy for 4 / 5 tasks and outperforms one-shot
prompting.
Finally, identifying and understanding relevant medical and health recommendations is a key
capability for interpreting public health guidance. Related to this, Chen et al. [51] evaluate
GPT-4 and GPT-3.5 on single label Biomedical classification tasks using the HealthAd-
vice [53] and CausalRelation [52] datasets. The HealthAdvice dataset is used to evaluate
the LLMs’ ability to identify whether a given sentence contains no, weak, or strong health
advice. The CausalRelation reasoning evaluation tests the LLMs’ ability to identify casual
and correlation claims in PubMed conclusion sentences. Testing a range of prompts from
zero-shot to few-shot with CoT, GPT-4 is shown to slightly outperform GPT-3.5 with 0.65-
0.77 macro-F1 scores across the tasks using the highest performing prompt (few-shot with
CoT).
6.2.3
