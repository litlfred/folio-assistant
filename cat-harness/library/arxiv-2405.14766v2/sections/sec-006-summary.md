---
doc_id: arxiv-2405.14766v2
doc_title: "Evaluating Large Language Models for Public Health Classification and Extraction Tasks"
section_id: sec-006-summary
section_title: "Summary"
section_number: null
pages: 7-9
source_pdf: arxiv-2405.14766v2.pdf
source_sha256: 07248c8e1578d9ea
toc_source: outline
---
pages from the gov.uk web page. The text was extracted and manually categorised
(Sec. 7) into one of eight broad health topics based on which team wrote the guidance
(e.g. Radiation, Sexually Transmitted Infections, etc.). The LLM is prompted with the
summary page and the list of possible health topics and asked to return the single health
topic that is most suitable for the text.
2. Guidance Recommendation Classification: Recommendations are a crucial component
of public health guidance. Demonstrating an LLM’s ability to identify recommendations
is an essential prerequisite to other processing of public health guidance. To evaluate
this we use UKHSA publications on gov.uk. Each publication is split into subsections
(chunks) and we manually annotate a random sample of 489 chunks of text, with one
of two labels: 1 (contains recommendations – defined as a statement containing a clear,
specific actionable instruction, request, or advice in the event of a given public health
scenario), or 0 (does not contain any recommendations). The LLM is prompted with the
text chunk and asked to answer "yes" or "no" (corresponding to class 1 or 0) to whether it
contains any recommendations.
3. Health Advice Classification: To further evaluate an LLM’s ability to understand rec-
ommendations, we adopt the HealthAdvice dataset from Chen et al. [51] (Sec. 6.2.2),
which includes 10,845 manually annotated sentences from the abstract and discussion
sections of PubMed articles. Each sentence has one of three labels: 0 (no advice), 1 (weak
advice – statement hints that a behaviour or practice may require changing, or that an
alternative approach for existing clinical or medical practice may be required), 2 (strong
7
advice – statement makes a clear and straightforward recommendation for a change in
behaviour or practice) [52]. The LLM is prompted with the sentence and asked to assign
the sentence a label of 0, 1, or 2, corresponding to the levels of health advice described.
This extends 2. to a different corpus (biomedical literature as opposed to public health
guidance), shorter text (sentences rather than chunks), and advice slightly differing in
definition from recommendation.
4. Health Causal Claims Classification: The final guidance-related task we consider is
evaluating an LLM’s understanding of the types of claims that can be found within guid-
ance and broader biomedical text. To do this, we use the Causal-Relation dataset [51]
(Sec. 6.2.2), which consists of annotated biomedical text from PubMed article conclusions.
Each sentence is labelled as one of the following classes: 0 (no relationship), 1 (corre-
lational relationship – association between variables are described, but causation is not
explicitly stated), 2 (conditional causal relationship – suggestion that one variable directly
changes the other, with an element of doubt), or 3 (direct causal – explicit statement that
one variable directly changes the other) [53]. The LLM is prompted with the sentence
and asked to assign a label of 0, 1, 2, or 3, based on the relationship described.
5. BioDex Drugs Extraction: To evaluate an LLM’s ability to extract information on
pharmaceutical interventions we use 1,558 randomly sampled entries from the BioDex
dataset [29] (Sec. 6.2.2) of annotated Adverse Drug Event reports and corresponding
PubMed articles. To account for different model context windows we first chunk each
article into sets of contiguous paragraphs of no more than 6000 characters. The LLM
is prompted to extracted the drugs involved in the ADE from each of the raw PubMed
article free text chunks.
6. PubMedQA: Text regarding guidance and interventions often includes supporting ev-
idence and relevant academic findings. Therefore, we also evaluate an LLM’s ability
to understand and reason about biomedical evidence. To evaluate an LLM on this task
we use the PubMedQA [54] benchmark in the "reasoning-required setting". The LLM
is prompted with a PubMed abstract (excluding any concluding sections) and asked to
answer the question ("yes", "no", or "maybe") that is posed in the title of the article. The
LLM’s performance is evaluated against expert human annotator answers.
2.1.4
Summary
In constructing these evaluations we have balanced general public health text processing
(such as drugs and disease extraction) with specific public health tasks (such as contact and
guidance classification). We also combine external evaluation datasets for comparability and
diversity of text with internal datasets that are more representative of public health specific
tasks and free text.
8
2.2
