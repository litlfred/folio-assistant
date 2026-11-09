---
doc_id: arxiv-2312.07755v1
doc_title: "Designing with Language: Wireframing UI Design Intent with Generative Large"
section_id: sec-007-32-fine-tune-large-language-models-with-best-pra
section_title: "Fine-tune Large Language Models with Best Practice"
section_number: 3.2
pages: 8-9
source_pdf: feng-2023-designing-with-language.pdf
source_sha256: 663850eb153e604d
toc_source: outline
---
Since the LLMs are not specifically designed to understand the UI design patterns, we fine-tune the LLMs with the natural
language description as the input and the UI wireframe in HTML syntax as the output (the same learning objective as
the pre-trained model). The implementation of fine-tuning process is not a trivial task [50], which can significantly
influence the performance of LLMs. To that end, we summarize three highly sensitive aspects in fine-tuning LLMs,
denoting training data selection, model selection, and hyperparameter configuration, and detail our implementation
informed by the best practices.
3.2.1
Training data selection. When fine-tuning LLMs, the size of the training dataset plays a non-negligible role [59].
On the one hand, the data size needs to be sufficient, diverse, and representative to enable the LLMs to learn the
characteristics of the specific task effectively. On the other hand, training on an excessive dataset can be time-consuming
and costly2. To strike a balance between the LLMs’ capability and the training cost, we attempt to select 1,000 samples
from the dataset, suggested by the previous work [83].
Regarding the sample selection, a simple random selection cannot ensure the LLMs’ generalizability and diversity, as
the UIs in the same app may convert to very similar HTML syntax. To avoid this data leakage problem [46], we select
the screens in the dataset by the app. We also ensure the representation of app categories and screen summaries are
diverse in the training dataset. In total, we collect 1,000 samples from 191 apps, covering 27 app categories, summarised
by an average of 7.1 words.
3.2.2
Model selection. There are numerous emerging LLMs that have exhibit promising performance in natural
language understanding and logical reasoning, such as PaLM [22], RoBERTa [56], T5 [64], etc. In this work, we adopt
the recent state-of-the-art LLM, GPT [14] from OpenAI with 175 billion parameters pre-trained on a massive dataset. It
is based on the transformer model [73] including masked multi-self attention, normalization layers, and feed-forward
layers (see in Fig. 3). GPT offers sets of models to support different levels of tasks, including Curie, Babbage, Ada, etc.
For our study, we choose the model Turbo (gpt-3.5-turbo) which is well suited to our task due to two reasons. First,
Turbo is the most advanced model and can perform tasks with less instruction compared to other models. It is especially
ideal for tasks of creative content generation and extensive understanding of the content. Second, Turbo excels in
solving logic problems and understanding the intent of code (e.g., HTML), and has been fine-tuned for programming
applications like Codex.
3.2.3
Hyperparameter configuration. In addition to the choice of model, fine-tuning performance can also be improved
through the customization of hyperparameters. According to the previous fine-tuning practices of LLMs [7, 14] that
shows promising performance across a range of use cases, we apply a learning rate of 0.1 and a batch size of 256. We
train the model for 4 epochs to enable the model to recognize the input prompt syntactic and usage patterns of the
fine-tuning data. Furthermore, there are three additional hyperparameters that have been optimized for the LLMs,
specifically GPT model:
• Temperature: determines how much randomness is in the generation, regarding new content creation. At a
temperature of 0.0, the model will always produce the same fixed response to an input text, regardless of the
2The pricing set by OpenAI https://openai.com/api/pricing/
8
Wireframing UI Design Intent with Generative Large Language Models
Fig. 5. An illustration of post-processing raw generation into better UI wirframes, adding semantic icons, refining text typography,
and adhering to UI guidelines.
number of generations. Raising the temperature value (with a maximum of 1.0) enables more creative output
from the pre-trained resources, but also increases the risk of generating irrelevant output. Based on previous
studies [14, 83], we set the value to 0.65 to balance robustness and creativity.
• Maximum_length: sets the upper limit of the number of generated tokens. The default value is 256, but generating
HTML syntax often requires more. Therefore, we set the value to the maximum of 4,096 tokens to accommodate
the requirement.
• Stop_sequence: when the generation of tokens stops. To control the endpoint of the generation in our task of
HTML syntax generation, As we aim to generate HTML syntax, we set the delimiter value to the HTML closing
tag, </html>.
3.3
