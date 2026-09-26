---
doc_id: arxiv-2504.19675v2
doc_title: "Annif at SemEval-2025 Task 5: Traditional XMTC augmented by LLMs"
section_id: sec-010-test-set-predictions
section_title: "Test set predictions"
section_number: null
pages: 4-4
source_pdf: 2504.19675v2.pdf
source_sha256: 5e8e75c26a95847b
toc_source: outline
---
For both GND variants, teams were allowed to
submit up to 10 separate runs (up to 50 subject
predictions per test set record). We LLM-translated
the test set records to produce German-only and
English-only versions of each record. For each of
the three ensemble types, we produced three runs:
1) using the German ensemble and the German-
only record, 2) using the English ensemble and
English-only record, and 3) combining the two
monolingual predictions into a single prediction by
summing the scores of the predicted subjects and
choosing the top 50 subjects by score. This gave us
a total of 9 runs per GND variant that we submitted
for evaluation.
5
Results
