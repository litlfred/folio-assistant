---
doc_id: arxiv-2604.00554v1
doc_title: "LLM-supported document separation for printed reviews from zbMATH Open"
section_id: sec-017-62-base-models
section_title: "Base models"
section_number: 6.2
pages: 5-6
source_pdf: 2604.00554v1.pdf
source_sha256: cabfd76a9acea030
toc_source: outline
---
Base models
The next step was to choose a model. Due to the technical limita-
tions of the GPU, we opted for models that require less than 16GB
of VRAM. The size of the context window was also critical. To avoid
the situation where the model may not be able to handle the text
of the document due to its size, it had to be more than 4 thousand
tokens (which corresponds to approximately 8 pages of plain text).
To search among open-source generative models, we used the
LLM Explorer website1 (as of 30.04.2024) which provides a conve-
nient interface for comparing generative LLMs available on Hug-
ging Face. As part of our project, we decided to focus on the
Instruction-Based Large Language Models because it best repre-
sents what we want the model to accomplish. In addition, there are
scores for the models on the website (Hugging Face average score).
This information was also an important criterion in the selection
of models.
We selected two models with the highest score and one model
with the highest score among the models with the largest number
1https://llm.extractum.io/
Pluzhnikov et al.
of parameters that we could use (as potentially more complex).
The characteristics of the selected models are provided in Table 3
(hereafter, we refer to them as "base" models).
Name
Score
Context Length
Size
VRAM (GB)
CalmExperiment-7B-slerp1
76.67
32k
7B
14.4
Maxine-7B-0401-Stock [22]
76.73
32k
7B
14.4
Mistral-Passthrough-8L-10B2
71.01
32k
10B
14.5
Table 3: Large Language Models overview.
