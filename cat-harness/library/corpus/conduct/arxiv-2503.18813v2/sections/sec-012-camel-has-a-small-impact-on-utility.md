---
doc_id: arxiv-2503.18813v2
doc_title: "Defeating Prompt Injections by Design"
section_id: sec-012-camel-has-a-small-impact-on-utility
section_title: "CaMeL has a (small) Impact on Utility"
section_number: null
pages: 11-11
source_pdf: arxiv-2503.18813v2.pdf
source_sha256: c3719f6ce73eecf4
toc_source: outline
---
Figure 8 reports the performance of different language models with CaMeL and with the official
tool-calling APIs. With an exception of Travel suite–on a subset of models–we find that CaMeL does
not significantly degrade utility. We discuss the Travel suite in detail below. Quite unexpectedly, in
rare cases, we find that CaMeL even improves the success rate of certain models on specific suites.
Finally it is worth noting that the performance of models using CaMeL significantly improved in a
second round of experiments where we employed more recent models. For example, OpenAI’s o3 has
around 10% more utility than o1, which is less than four months older than o3.
