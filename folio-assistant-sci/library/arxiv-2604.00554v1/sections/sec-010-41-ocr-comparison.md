---
doc_id: arxiv-2604.00554v1
doc_title: "LLM-supported document separation for printed reviews from zbMATH Open"
section_id: sec-010-41-ocr-comparison
section_title: "OCR comparison"
section_number: 4.1
pages: 3-4
source_pdf: 2604.00554v1.pdf
source_sha256: cabfd76a9acea030
toc_source: outline
---
OCR comparison
In this section, we provide the evaluation results for the OCR
tools (Table 2). The results indicated that Mathpix outperforms In-
ftyReader, Marker, and Nougat in BLEU and Edit Distance. Marker
shows the second-best result in terms of BLEU and Nougat in terms
of Edit Distance. InftyReader consistently lagged behind the other
three tools.
Based on the evaluations performed, Mathpix was selected to
convert the scanned images to LaTeX. Better scores than other
tools on all metrics underscored its ability to better handle this task.
The choice of Mathpix provided the highest quality of processed
documents available to us.
Pluzhnikov et al.
Table 2: Performance metrics of the OCR systems.
Metric
Mathpix
InftyReader
Nougat
Marker
Average BLEU
0.7237
0.5422
0.5666
0.5723
Average Edit Distance
0.1733
0.2219
0.1912
0.2046
