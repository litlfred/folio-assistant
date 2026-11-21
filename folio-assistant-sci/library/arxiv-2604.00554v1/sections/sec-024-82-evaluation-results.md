---
doc_id: arxiv-2604.00554v1
doc_title: "LLM-supported document separation for printed reviews from zbMATH Open"
section_id: sec-024-82-evaluation-results
section_title: "Evaluation results"
section_number: 8.2
pages: 7-8
source_pdf: 2604.00554v1.pdf
source_sha256: cabfd76a9acea030
toc_source: outline
---
Evaluation results
This section presents a comprehensive evaluation on the test dataset
of the approaches developed by us, as well as ChatGPT-based and
CV-based. The results are shown in Table 4
Based on the results obtained, we conclude that our proposed
approaches leveraging Large Language Models significantly outper-
form alternative methods, which are based on regular expressions,
Pluzhnikov et al.
Approach
Accuracy
Regular Expressions
68.8%1
ChatGPT-4o
51 %
ChatGPT-4o Few Shot Learning
52.1 %
DIT
48.5%2
CalmExperiment-7B-slerp
96.2%
Maxine-7B-0401-Stock
93.1%
Mistral-Passthrough-8L-10B
93.7%
Majority Voting
97.5%
Table 4: Evaluation results of the document splitting ap-
proaches.
the widely used ChatGPT-4o model (which often included super-
fluous metadata in the response), and computer vision techniques.
Among the models that we fine-tunde, CalmExperiment-7B-slerp
showed the best result, outperforming the others by more than 2%.
However, expectedly the highest accuracy was demonstrated by
the Majority Voting approach - 97.5%.
