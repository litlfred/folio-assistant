---
doc_id: arxiv-2504.19675v2
doc_title: "Annif at SemEval-2025 Task 5: Traditional XMTC augmented by LLMs"
section_id: sec-004-translation-of-data-sets
section_title: "Translation of data sets"
section_number: null
pages: 2-3
source_pdf: 2504.19675v2.pdf
source_sha256: 5e8e75c26a95847b
toc_source: outline
---
We
used
the
Llama-3.1-8B-Instruct
LLM
(Grattafiori et al., 2024) for translating the titles
and abstracts of all records.
Each record was
translated separately into a German-only and
English-only record (step 1 in Figure 1). More
details on LLM processing are given in Appendix
D.
original 
records
German 
only
English 
only
German 
synthetic 
part 1
German 
synthetic 
part 2
German 
synthetic 
part 3
English 
synthetic 
part 1
English 
synthetic 
part 2
English 
synthetic 
part 3
1. translation
2. generation of synthetic records
Figure 1: LLM pre-processing steps for the data sets.
The MLLM lexical backend requires that the
vocabulary terms must be in the same language
as the records. Therefore, we used the GPT-4o-
mini LLM to translate all GND preferred terms in
German into English and created bilingual variants
of the GND SKOS files.
3.2
Synthetic training data
We found that the number of training records pro-
vided was quite small compared to the size of the
subject vocabulary, so we used the Llama-3.1-
8B-Instruct LLM to generate additional synthetic
training records. We presented the LLM with each
of the existing train records (its title and abstract)
at a time along with its manually assigned subject
labels (GND preferred terms in either German or
English, matching the language of the document).
We then asked the LLM to generate a similar record
with the same set of subjects plus one additional,
randomly chosen preferred term from the GND
(step 2 in Figure 1; see also example in Figure
4 in Appendix D). This additional subject caused
the LLM to generate a novel record, not just to
rephrase the given example, and also helped to ex-
pand the subject coverage of the training data set
to new GND subjects.
4
