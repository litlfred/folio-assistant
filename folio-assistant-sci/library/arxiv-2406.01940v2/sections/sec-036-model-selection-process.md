---
doc_id: arxiv-2406.01940v2
doc_title: "Work in progress PROCESS-DRIVEN AUTOFORMALIZATION IN LEAN 4"
section_id: sec-036-model-selection-process
section_title: "Model Selection Process"
section_number: null
pages: 28-28
source_pdf: 2406.01940v2.pdf
source_sha256: 1cfc906589df5afc
toc_source: outline
---
Model Selection Process: Our model selection process involved a rigorous comparative evaluation of
GPT-4 and Gemini-Pro-1.5. We sampled 10 inputs from the extracted formal theorems and recruited
four human annotators to cross-evaluate the informalization outputs of both models. The evaluation
was based on three key metrics:
1. Success of statement informalization: Assessing whether the translated natural-language statement
is logically accurate and semantically equivalent to the formal statement.
2. Informalized proof correctness: Evaluating whether the translated natural-language proof is
logically valid to prove the statement.
3. Model preference: Determining whether the translation output of one model is preferred over the
other, with only one ’True’ value allowed per sample.
Both models demonstrated satisfactory performance in informalization success (Gemini-Pro-1.5:
80%; GPT-4: 70%) and informalized proof correctness (both at 80%). However, Gemini-Pro-1.5
consistently achieved higher scores with a high interrater agreement rate of 0.77. Moreover, when
tasked to cross-compare the model outputs based on their statement and proof generation, annotators
preferred Gemini-Pro-1.5 in 80% of the samples.
The detailed annotation protocol and comprehensive results of this evaluation process are provided in
Appendix F.
L
