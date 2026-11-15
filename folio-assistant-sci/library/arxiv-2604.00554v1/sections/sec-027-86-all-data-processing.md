---
doc_id: arxiv-2604.00554v1
doc_title: "LLM-supported document separation for printed reviews from zbMATH Open"
section_id: sec-027-86-all-data-processing
section_title: "All data processing"
section_number: 8.6
pages: 9-9
source_pdf: 2604.00554v1.pdf
source_sha256: cabfd76a9acea030
toc_source: outline
---
All data processing
After achieving a high accuracy score on the test dataset, the next
step was to use the best approach we had created on the entire
dataset. Thus, we applied the Majority Voting approach to 810,977
elements in the zbMATH Open table, finishing the transformation of
these mathematical documents into machine-readable and search-
able formats as a practical outcome of this research. The result of
Majority Voting differed from the CalmExperiment-7B-slerp model
in 3.4% of the cases. As a result, we extracted texts for the 810,977
documents. After that, we obtained the start and end indexes of
the documents using these texts. This process yielded results for
721,288 documents - 88.9% of the total number of texts from the
previous step.
