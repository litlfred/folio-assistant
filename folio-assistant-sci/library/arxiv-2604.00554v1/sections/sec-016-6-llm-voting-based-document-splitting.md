---
doc_id: arxiv-2604.00554v1
doc_title: "LLM-supported document separation for printed reviews from zbMATH Open"
section_id: sec-016-6-llm-voting-based-document-splitting
section_title: "LLM-voting based document splitting"
section_number: 6
pages: 5-5
source_pdf: 2604.00554v1.pdf
source_sha256: cabfd76a9acea030
toc_source: outline
---
LLM-voting based document splitting
Several approaches based on the generative LLMs have shown
success in document splitting tasks. Hence, we used generative
LLMs as possible candidates for the solution.
6.1
Methodology
The idea of the approach is as follows:
(1) For each 𝑟𝑜𝑤in the zbMATH Open table
(2) Read the next row from the zbMATH Open table as the
𝑛𝑒𝑥𝑡_𝑟𝑜𝑤.
(3) Add to the prompt instructions for extracting the docu-
ment, 𝑟𝑜𝑤[Original title] if exist (otherwise 𝑟𝑜𝑤[Title]),
𝑟𝑜𝑤[Source].
(4) Add to the prompt 𝑛𝑒𝑥𝑡_𝑟𝑜𝑤[Original title] if exist (other-
wise 𝑛𝑒𝑥𝑡_𝑟𝑜𝑤[Title]), 𝑛𝑒𝑥𝑡_𝑟𝑜𝑤[Source].
(5) Implement the step 3 from the section 5.1. Add the result
to the prompt.
(6) Inference of the generative LLM with the resulting prompt.
In the case when the document was the last in the book, we
followed the procedure outlined in section 5.1. An example of the
prompt can be seen in Figure 3. We also applied the steps described
in section 5.2 to the zbMATH Open table.
Figure 3: Example of the prompt and correct genera-
tive Large Language Model output for the document
https://zbmath.org/0005.34202.
