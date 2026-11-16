---
doc_id: arxiv-2604.00554v1
doc_title: "LLM-supported document separation for printed reviews from zbMATH Open"
section_id: sec-009-53-challenges
section_title: "Challenges"
section_number: 5.3
pages: 3-3
source_pdf: 2604.00554v1.pdf
source_sha256: cabfd76a9acea030
toc_source: outline
---
cal literature. Also, it should consist of "Page" - "LaTeX represen-
tation" (as ground truth) pairs. To the best of our knowledge (as
of 07.2024), there is no dataset already collected that meets the
specific needs of this research [3]. Consequently, we collected our
own dataset comprising 25 pages sourced from a variety of STEM
articles within the Arxiv dataset [6], which offers a rich collection
of scientific papers in LaTeX format. Of these pages, 22 contain
mathematical content, such as formulas. The LaTeX code associated
with each page was manually extracted, ensuring a high standard
of accuracy to serve as the ground truth in our evaluations.
3.3
Metrics
In this paper, when evaluating existing OCR systems that process
LaTeX outputs, we applied the BLEU metric [3, 32, 36–39], which
focuses on n-gram precision, and Edit Distance [3, 32, 37, 39], which
measures textual similarity between generated and reference out-
puts.
In the articles [20, 33] authors, like us, employ generative LLMs
to solve the documents splitting task, with accuracy serving as
the main metric to evaluate quality. In this case, accuracy is the
proportion of correctly processed documents among all documents
for which processing was performed. For the document splitting
task, we applied this metric.
To properly use the accuracy metric, we must define what is
considered a correctly processed document (ground truth) in our
splitting task for different types of output. In case the text of the
document is the output, the model should provide all LaTeX code
from the OCR output located between the first and last characters
of the document text, and only it. Among the modifications, OCR
errors can be corrected (for example, removing extra spaces before
punctuation marks), and metadata can be removed (for example,
the page number) from the text. If the document start and end
indexes are output, they should point respectively to the first and
last character of the document text in the LaTeX representation. If
there is no document, "not reviewed." should be returned.
4
Document Splitting
