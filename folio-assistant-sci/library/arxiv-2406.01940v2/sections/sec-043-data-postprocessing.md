---
doc_id: arxiv-2406.01940v2
doc_title: "Work in progress PROCESS-DRIVEN AUTOFORMALIZATION IN LEAN 4"
section_id: sec-043-data-postprocessing
section_title: "Data Postprocessing"
section_number: null
pages: 31-31
source_pdf: 2406.01940v2.pdf
source_sha256: 1cfc906589df5afc
toc_source: outline
---
We apply a post-filtering process to both the training and test sets to uphold the quality of data
examples. The exclusion criteria were as follows:
• Instances where the API failed or produced empty content during the informalization stage.
• Cases where the length of the natural-language question or answer did not exceed 400 char-
acters, or the length of the formalized theorem and proof did not exceed 200 characters. This
step ensures that each datapoint retains complexity and richness for the autoformalization
task.
• Situations where the informalization was evidently incorrect were manually reviewed and
removed. It is important to note that this manual check was not applied to the entire dataset.
P
