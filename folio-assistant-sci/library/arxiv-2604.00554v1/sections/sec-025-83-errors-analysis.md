---
doc_id: arxiv-2604.00554v1
doc_title: "LLM-supported document separation for printed reviews from zbMATH Open"
section_id: sec-025-83-errors-analysis
section_title: "Errors analysis"
section_number: 8.3
pages: 8-8
source_pdf: 2604.00554v1.pdf
source_sha256: cabfd76a9acea030
toc_source: outline
---
Errors analysis
This section reviews the main sources of errors that occur when
using the Majority Voting method and analyzes each type. By do-
ing this, we can better understand the limitations of the current
approach and guide further optimization efforts to improve the
accuracy and reliability of document-splitting methods.
• OCR formatting errors: an OCR error may cause the
document to be processed incorrectly (e.g., including the
document author in brackets beginning in the document’s
text may cause the model to recognize the author as part
of the text itself). In the test data, it occurred in 2 cases.
• Ambiguity in similar titles: in zbMATH Open data, neigh-
boring document titles can be nearly identical, differing
only by part numbers or minor variations in wording (e.g.,
"Invariant Imbedding and Radiation Dosimetry. VI" vs. "In-
variant Imbedding and Radiation Dosimetry. V"1). This sim-
ilarity can lead the LLM to mistake one document for the
other. In the test data, it occurred in 2 cases.
• Hallucinations in Large Language Models outputs:
Our approach is also susceptible to the problems of any
generative LLMs - hallucination [12]. The reason is the pre-
dictive nature of Transformers. These models are trained
to find the most likely sequences of tokens based on huge
amounts of text and, in our case, can, at some point, con-
tinue the text of the document with tokens that seem logical
but are not in the original text. Longer documents are more
prone to this problem because they require more tokens to
be generated. In the test data, it occurred in 4 cases.
• Metadata issues: in some cases, the model may mistake
metadata for part of the document or vice versa. In such a
case, either extra text will be returned or the required text
will not be returned. In the test data, it occurred in 4 cases.
1No document text was offered for the 12 titles.
2Accuraccy upper bound.
1https://zbmath.org/0274.92002
