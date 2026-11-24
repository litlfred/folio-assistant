---
doc_id: arxiv-2604.00554v1
doc_title: "LLM-supported document separation for printed reviews from zbMATH Open"
section_id: sec-028-9-conclusion
section_title: "Conclusion"
section_number: 9
pages: 9-9
source_pdf: 2604.00554v1.pdf
source_sha256: cabfd76a9acea030
toc_source: outline
---
Conclusion
This project successfully identified the optimal OCR tool, Mathpix,
for converting scanned pages to LaTeX format, using the BLEU
Score and Edit Distance metrics. As the next step, 252,624 scanned
pages from zbMATH Open were converted into LaTeX. Building
on this, we developed a problem-specific method for automatic
document splitting using Large Language Models. By employing
a Majority Voting mechanism across three fine-tuned generative
LLMs, the proposed approach achieved an accuracy rate of 97.5%
on the test dataset when providing the text of the documents, sig-
nificantly surpassing the baseline methods based on regular expres-
sions, Computer Vision, and ChatGPT-4o. Another advantage of
our approach is its ability to correct errors made by OCR, as well as
to remove metadata (e.g., page numbers) from document texts. We
also identified the start and end indexes of the documents for 90.6%
of the test dataset. On the subset where the method was applicable,
we achieved accuracy of 98.4% with 89.1% accuracy on the whole
test dataset.
This work contributes several advancements:
(1) A pipeline for digitizing and splitting documents with math-
ematical content from scans.
(2) Demonstrating generative LLM’s ability and superiority in
handling complex document splitting tasks.
(3) As a practical outcome, we made 810,977 zbMATH Open
documents (as text) and 721,288 (as start and end indexes
in LaTeX representation of scans) machine-readable and
searchable. These documents are now available for applica-
tions such as Math Information Retrieval systems, search
engines, plagiarism detection, and neural network training.
The results of the research, including code, models, and datasets,
have been made publicly available1, 2, 3, 4, 5, 6, encouraging future
research and practical implementations in similar domains.
Acknowledgments
Funded by the Deutsche Forschungsgemeinschaft (DFG, German
Research Foundation) – 437179652; 567156310.
