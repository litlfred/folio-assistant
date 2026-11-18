---
doc_id: arxiv-2604.00554v1
doc_title: "LLM-supported document separation for printed reviews from zbMATH Open"
section_id: sec-000-abstract
section_title: "Abstract"
section_number: null
pages: 1-1
source_pdf: 2604.00554v1.pdf
source_sha256: cabfd76a9acea030
toc_source: outline
---
This paper presents a specialized methodology for digitizing and
segmenting mathematical documents from zbMATH Open, a com-
prehensive database of mathematical literature, to enhance ma-
chine processing capabilities. Currently, approximately 831,000
documents exist only in scanned volumes, which makes them not
machine-processable. Furthermore, these scans often span multi-
ple pages or share pages with other documents and incorporate
diverse typesetting techniques, posing challenges for automated
processing.
To address these issues, we evaluate various Optical Charac-
ter Recognition (OCR) tools and document separation techniques,
proposing an optimized pipeline that outperforms existing ap-
proaches. Our study identifies Mathpix as the most effective OCR
tool for LaTeX conversion, demonstrating superior performance
based on BLEU and Edit Distance metrics. For document sepa-
ration, we fine-tune generative Large Language Models (LLMs)
and integrate them into a Majority Voting framework, achieving
97.5% accuracy when providing the text of the document. Addi-
tionally, our method identifies the start and end indexes for 90.6%
of the test dataset, with an accuracy of 98.4% on applicable cases,
resulting in an overall accuracy of 89.1% on the entire dataset. This
approach surpasses traditional baselines, including regular expres-
sions, ChatGPT-4o, and computer vision-based techniques. As a
practical outcome, we process 810,977 mathematical documents
into machine-readable text and extract precise document bound-
aries for 721,288 documents in LaTeX format. These contributions
significantly improve accessibility for mathematical information re-
trieval systems, machine learning models, and related applications.
