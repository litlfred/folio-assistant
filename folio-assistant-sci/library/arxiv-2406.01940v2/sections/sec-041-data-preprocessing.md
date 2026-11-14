---
doc_id: arxiv-2406.01940v2
doc_title: "Work in progress PROCESS-DRIVEN AUTOFORMALIZATION IN LEAN 4"
section_id: sec-041-data-preprocessing
section_title: "Data Preprocessing"
section_number: null
pages: 30-30
source_pdf: 2406.01940v2.pdf
source_sha256: 1cfc906589df5afc
toc_source: outline
---
Firstly, we retain the “#align” command within the proof, which is used by Mathport6 to connect
Lean 3 names to Lean 4 names. This inclusion is intended to facilitate the informalization process
for GPT-4 during data construction, as we hypothesize that GPT-4 will better understand the Lean 4
language if there is a connection to the more familiar Lean 3 language.
Secondly, all samples with custom Mathlib 4 lemma (as indicated by the ’.mk’ suffix) in the theorem
statement are removed. This is because such lemmas are custom-defined under the same file of the
theorem inside the Mathlib 4 library, hence the model will have no access to its definition, causing
inevitable ambiguity or uncertainty in informalization7. Altogether 262 samples are filtered, with 236
from the train set, 6 from the basic test set, and 20 from the random test set.
Lastly, 35 samples in the real test set specified to be solved in Python are removed for being unsuitable
for autoformalization evaluation.
O.2
