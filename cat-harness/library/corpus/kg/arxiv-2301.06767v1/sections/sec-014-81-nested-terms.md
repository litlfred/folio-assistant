---
doc_id: arxiv-2301.06767v1
doc_title: "The Recent Advances in Automatic Term Extraction: A survey"
section_id: sec-014-81-nested-terms
section_title: "Nested terms"
section_number: 8.1
pages: 19-19
source_pdf: arxiv-2301.06767v1.pdf
source_sha256: 4bc8757e43cda7d6
toc_source: outline
---
Nested terms
Nested terms refer to words or phrases that are both terms themselves and parts of longer terms. This means that a
shorter term may appear within a larger term and vice versa. For example, in ACTER’s English Corruption dataset,
the word “confiscation” is a standalone term that also appears as a part of other longer terms such as “confiscation of
corruption proceeds”, “confiscation of criminal assets”, and “confiscation of the proceeds of crime”. This makes the labeling
harder, as the classifier needs to infer from the context whether a specific term is part of a longer term. This leads to the
most common problem of current systems, which is that instead of predicting the whole multi-word term, they predict
only a shorter gold standard term nested in the multi-word gold standard term. Vice versa, the model sometimes also
generates incorrect predictions containing the correct nested terms.
