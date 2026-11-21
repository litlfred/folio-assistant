---
doc_id: arxiv-2604.00554v1
doc_title: "LLM-supported document separation for printed reviews from zbMATH Open"
section_id: sec-018-63-fine-tuning
section_title: "Fine-tuning"
section_number: 6.3
pages: 6-6
source_pdf: 2604.00554v1.pdf
source_sha256: cabfd76a9acea030
toc_source: outline
---
Fine-tuning
To significantly reduce the resources spent adapting the Large Lan-
guage Models to specific the task, we used the fine-tuning technique
[15]. Instead of training neural networks from scratch, we took pre-
trained ones. Since the models learned to solve NLP problems, they
were already able to work with the basic concepts of the language.
In this case, we needed much less time, computing resources, and
data to achieve a good result. To speed up fine-tuning of Large
Language Models, we used the LoRa (Low-Rank Adaptation) op-
timization technique [11]. For implementation of the fine-tuning,
we utilized LLaMA-Factory [42].
To select the optimal hyperparameters, such as the learning rate
and the number of epochs for fine-tuning, we validated the models
(with the cosine learning rate scheduler and batch size equal to
2 as the largest number we could use due to the GPU limits) by
splitting the train dataset in a ratio of 80% (for training) and 20% (for
validation). The split was made at random. The validation results
can be seen in Figure 4.
Based on the data obtained, the learning rate was chosen to be
0.0005 for all models, since at this rate the losses for all of them
are the minimum of those presented. The number of epochs for
training all models was determined to be 5 because at this point
the loss value stabilized and stopped decreasing. Upon reaching
this epoch, CalmExperiment-7B-slerp shows the smallest loss of all
models.
Taking into account all the hyperparameters described above,
we performed a fine-tuning of all three models. All 1000 samples
from the train dataset were used. The training loss can be seen in
Figure 5.
