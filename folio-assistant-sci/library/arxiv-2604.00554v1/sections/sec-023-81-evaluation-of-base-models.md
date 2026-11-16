---
doc_id: arxiv-2604.00554v1
doc_title: "LLM-supported document separation for printed reviews from zbMATH Open"
section_id: sec-023-81-evaluation-of-base-models
section_title: "Evaluation of 'base' models"
section_number: 8.1
pages: 7-7
source_pdf: 2604.00554v1.pdf
source_sha256: cabfd76a9acea030
toc_source: outline
---
Evaluation of "base" models
To assess the performance of the "base" models prior to fine-tuning,
we evaluated their initial versions on the document splitting task.
This allowed us to quantify the improvements achieved through
fine-tuning by comparing the resulting accuracy. For this, we used
the test dataset.
Our results showed that none of the models returned outputs that
met the accuracy criteria. The models returned a lot of unnecessary
text (e.g. trying to continue text from scanned pages or keeping
the metadata about the document), despite the refinements in the
prompt. In addition, the searched documents were often not even
partially included in the output. Thus, the accuracy metric for "base"
models without fine-tuning is 0%. We conclude that these models
are unsuitable for solving our task without fine-tuning.
