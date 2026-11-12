---
doc_id: arxiv-2505.06046v4
doc_title: "Healthy LLMs? Benchmarking LLM Knowledge of UK Government Public Health Information"
section_id: sec-007-pre-processing-and-chunking
section_title: "Pre-processing and chunking"
section_number: null
pages: 4-4
source_pdf: arxiv-2505.06046v4.pdf
source_sha256: 6d70ff446a42c7dc
toc_source: outline
---
HTML documents are pre-processed and converted into markdown format. PDF document extrac-
tion is more challenging. Therefore, we use a two stage pipeline to achieve the requisite performance
on PDF documents. We first extract the raw text from the PDFs using existing tools. We then use
OpenAI’s GPT-4o-mini vision LLM via the API, prompting the model to extract the text from the
image (including markdown headers). For each page individually we pass: an image of the PDF
page, the raw markdown text extracted using existing tools for that page at the first step, and the
header hierarchy. We then split the documents into 20,488 smaller section chunks based on the
markdown headers of each document, and include the hierarchy of higher level headers into every
chunk to ensure relevant wider context and document structure is available.
3.3
