---
doc_id: arxiv-2312.07755v1
doc_title: "Designing with Language: Wireframing UI Design Intent with Generative Large"
section_id: sec-005-3-approach
section_title: "Approach"
section_number: 3
pages: 4-5
source_pdf: feng-2023-designing-with-language.pdf
source_sha256: 663850eb153e604d
toc_source: outline
---
modal information such as the textual content, visual design, hierarchy layout patterns, and app meta-data. Similarly,
Screen2Words [75] proposes a screen summarization approach to describe the functionalities of the UI screenshots.
Some research specifically generates semantically alt-text labels for UI elements [16, 17, 20, 27, 31, 32, 32, 34, 78]. These
studies attempt to learn the latent representation of UIs to generate natural language understanding. On the contrary,
our work focuses on interpreting natural language descriptions into UIs.
The interest in involving natural language as a form of interaction for graphic designs has recently found success in
text-to-image generative models. Variational autoencoder (VAE) [47] and generative adversarial network (GAN) [37] are
frequently used in generating graphic designs. For example, Aoki et al. [12] introduce a GAN-based model EmoBalloon
to generate emotional speech balloons in the chat UI. Recently, advances in LLMs [14] and diffusion models [41]
have introduced methods that are remarkable at generating images based on text prompts. While state-of-the-art
text-to-image works such as DALLE [65], Stable Diffusion [67], and MidJourney [8] show amazing performance in
creating aesthetic designs, they still have risks in generating realistic designs [4, 65]. First, they are great at drawing
but horrible at spelling words, e.g., prompting with “an image with Twitter text” may generate “Ttiter”, “Tw.uTe:”, or
mostly unrecognizable text. Second, coherence in designs is often missing while human creations would never lack,
e.g., shape incoherences, lack of components composability, etc. These potential flaws make it difficult to apply to
create UI wireframes with the finest details as demonstrated in Fig. 8. As a substitution, Huang et al. [43] propose a UI
Generator, that uses a deep-learning model to generate coordinates of UI elements from textual description. However,
those coordinates can only be interpreted into the layout of UI, i.e., a simple low-fidelity UI wireframe, which still
requires designers to mentally imagine the actual contents in their heads. Our work expands their research by prompting
generative LLMs, comprising billions of web layout and content understandings, to generate a UI-specific language,
which can be parsed into a mid-fidelity wireframe, including similar-to-real content, semantic functionalities, etc.
2.3
Prompting Large Language Models
Deep learning has introduced more opportunities for natural language understanding. The development of transformer-
based deep neural language models such as BERT [26] has shown its potential value in many applications. For example,
the aforementioned UI Generator [43] leverages a BERT model to embed text description to generate a sequence of
UI elements’ coordinates. Recent advancements in large language models (LLMs), such as GPT [14], LLaMA [72],
PaLM [22], RoBERTa [56], have led to boost performances on zero-shot, few-shot, and fine-tuned with handcrafted
prompts compared to prior deep learning methods. Zero-shot prompts directly describe what ought to happen in a task,
and few-shot prompts show the LLMs what pattern to follow by feeding it examples of desired inputs and outputs. While
4
Wireframing UI Design Intent with Generative Large Language Models
Fig. 3. The overview of WireGen that contains three phases: (i) Data Preparation phase (Section 3.1) that collects dataset of UI
wireframes and their associated high-level descriptions. (ii) Model Fine-tuning phase (Section 3.2) that implements the the best
practices of modern strategies to fine-tune the LLMs. (iii) Output Beautification phase (Section 3.3) that transforms the raw output
into visually appealing UI wireframes.
zero-shot or few-shot prompts allow to prototype common tasks, their inherent limitations (e.g., lack of domain-specific
understanding, limited input prompt length) make them less capable of prototyping specific applications [55, 60, 81].
Therefore, LLMs fine-tuning, encoding lexical, syntactic, and semantic regularities of the domain-specific language, is
then used to master specific task capabilities. For example, Codex [21] is a fine-tuned version of GPT-3, that can help
developers with code generation. Many studies have applied fine-tuning to support different domain-specific tasks,
such as InstructGPT [62], FLAN-T5 [23], math word solving [84], etc. In this same line of research, we fine-tune the
LLMs to support the domain-specific task of UI wireframing, providing insight into how natural language interaction
can help designers.
3
APPROACH
Given a natural language description of the design intent for a UI, we harness the power of generative LLMs to
automatically create mid-fidelity wireframes to greatly help designers gain design inspiration and create prototypes for
different use cases and contexts. The overview of our approach is shown in Fig. 3, which is divided into three main
phases: (i) Data Preparation phase that collects dataset of UI wireframes and their associated high-level descriptions; (ii)
Model Fine-tuning phase that implements the the best practices of modern strategies to fine-tune the LLMs to recognize
the UI patterns; (iii) Output Beautification phase that transforms the raw output into visually appealing UI wireframes
that are interactive and consistent with design guidelines.
3.1
