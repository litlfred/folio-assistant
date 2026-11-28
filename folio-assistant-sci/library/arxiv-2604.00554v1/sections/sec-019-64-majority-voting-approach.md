---
doc_id: arxiv-2604.00554v1
doc_title: "LLM-supported document separation for printed reviews from zbMATH Open"
section_id: sec-019-64-majority-voting-approach
section_title: "Majority Voting approach"
section_number: 6.4
pages: 6-7
source_pdf: 2604.00554v1.pdf
source_sha256: cabfd76a9acea030
toc_source: outline
---
Majority Voting approach
In addition to using each model individually, we have implemented
an approach that allows them to be used simultaneously - to reduce
the probability of mistakes by accounting for multiple predictions.
The popular technique of model assembly was used, Majority Voting
[28]. The essence of this method is as follows:
(1) For every document, each of the models proposes its output.
(2) If the output of any 2 models matches, this result is consid-
ered final.
(3) If all 3 outputs are different, we take the output of the
model that performed better on the validation dataset -
CalmExperiment-7B-slerp. Hereafter, we refer to it as the
"best" model.
1https://huggingface.co/allknowingroger/CalmExperiment-7B-slerp
2https://huggingface.co/DeepKarkhanis/Mistral-Passthrough-8L-10B
(a) CalmExperiment-7B-slerp validation loss.
(b) Maxine-7B-0401-stock validation loss.
(c) Mistral-Passthrough-8L-10B validation loss.
Figure 4: Validation losses of the Large Language Models.
Regarding just using the "best" model, it can help in the following
way. If the "best" model happens to make an error, the collaborative
nature of the Majority Voting system allows for errors to be cor-
rected by leveraging consensus from the other models. At the same
time, there may be a chance of making the result worse than just
using the "best" model, but it requires that the other two models
LLM-supported document separation for printed reviews from zbMATH Open
Figure 5: Training losses of the Large Language Models.
make the same mistake in the document splitting process, and the
answer of the "best" model is simultaneously correct.
