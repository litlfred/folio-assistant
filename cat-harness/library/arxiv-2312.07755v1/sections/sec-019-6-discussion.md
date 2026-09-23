---
doc_id: arxiv-2312.07755v1
doc_title: "Designing with Language: Wireframing UI Design Intent with Generative Large"
section_id: sec-019-6-discussion
section_title: "Discussion"
section_number: 6
pages: 17-18
source_pdf: feng-2023-designing-with-language.pdf
source_sha256: 663850eb153e604d
toc_source: outline
---
In Section 4 and Section 5, we evaluate and examine WireGen ’s effectiveness and usefulness for automatically generating
mid-fidelity UI wireframes from natural language descriptions. We see several opportunities to improve the performance
of our LLMs. For example, we see that training on a large dataset can deliver better results. However, due to budget
constraints, we only use 1,000 data for training. Once we have enough budget, we can improve the performance of the
LLMs by incorporating more data.
The LLMs are obviously not omnipotent, and still, fail to provide ready-to-use outputs in many cases. To enhance the
raw wireframe generations, we implement several post-processing methods (Section 3.3) based on a small-scale study,
including incorporating semantic icons, adjusting text typography, and following UI guidelines. However, this study
was limited in scope and merely aimed to provide a basic analysis of the potential UI design flaws produced by GPT-3.
Further research is needed to fully understand the design limitations of LLMs and to develop more effective solutions.
17
Feng et al.
Our work focuses on using UI screens and their corresponding view hierarchy information to construct UI-specific
prompts. However, UI screens have various other modalities, including app information, interaction context, etc, which
are left unused in our study. In future work, we aim to enhance the prompts by incorporating representations of multiple
modalities, thereby improving performance.
Our work focuses on generating UI wireframes from a single description. However, UI design often involves multiple
iterations and accumulations of ideas. To streamline this process, we aim to integrate chat interactions in the future.
This could be achieved through inspired by ChatGPT [3]. For example, a designer could interact with the chatbot to
design a login page with Google authentication service: “[Designer]: I want a UI wireframe design of a login page.”;
[Bot]: <UI Wireframe>; [Designer]: I want to add a Google authentication."; [Bot]: <UI Wireframe+Google>", simulating
a human-like design process through dialogue. In the future, we aim to enhance the interactivity of our design process,
making it more conversational in nature.
A straightforward extension of our work would be the retrieval of UI design examples. Numerous studies [15, 40, 42]
have demonstrated the usefulness of low-fidelity wireframes to retrieve existing UI design examples from datasets,
thereby facilitating UI design. Our mid-fidelity wireframes could further enhance this retrieval process by incorporating
semantic information such as text and icon semantics. To achieve this, we could employ the mature Screen2Vec
method [53] to encode visual and textual information into an embedding vector. By comparing the embedding vectors
between the generated UI wireframe and the designs in existing UI datasets, we could retrieve semantically similar UI
designs. This would help designers broaden their perspectives and gain inspiration. Future work could leverage our
work into these potential applications to reduce the time and resources required for UI design, and ultimately improve
the user experience.
7
