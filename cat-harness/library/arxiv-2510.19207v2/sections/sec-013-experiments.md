---
doc_id: arxiv-2510.19207v2
doc_title: "Defending Against Prompt Injection with DataFilter"
section_id: sec-013-experiments
section_title: "Experiments"
section_number: null
pages: 6-6
source_pdf: arxiv-2510.19207v2.pdf
source_sha256: cdfa941ee76d59d0
toc_source: outline
---
from hallucination [60]: specifically, after deleting the in-
jection, the model may hallucinate to complete the rest of
response instead of copying the remaining benign data. This
is because the base LLM, before our fine-tuning, was trained to
do completion, i.e., generate reasonable next tokens based on
the previous ones. When deleting some of the input, the filter
LLM may forget its designed purpose to repeat its input, and
switch to do “completion”. To mitigate this issue, we include
samples that encourage the model to be comfortable about not
completing. Specifically, we cut out some parts at the end of
the benign Alpaca data, and then perform simulated injection:
u = ua, x = truncate(xa) + u′
a + x′
a, xclean = truncate(xa).
Those samples encourage the filter LLM to output an abruptly-
ended data without any completion if the input data ends
abruptly. Heuristically, we retain the uncut benign data in 65%
of cases, truncate the last 1/3 of data in 10% of cases, truncate
the last 1/2 of data in 10% of cases, and remove all benign
data in 15% of cases.
Goal 3: Output the filtered data without endless repeti-
tion. Besides hallucination, we also saw a phenomenon where
the LLM’s End-Of-Sentence (EOS) special token (<|eot_id|>)
is not generated when it should be generated to stop the output,
causing the output to repeat endlessly. As our filter task is very
close to repeating parts of the input (which already contains an
EOS token to separate different message types), a new EOS
token is needed to prevent endless repetition after the first
repetition-like generation of the filtered data output. Thus, we
add a new special EOS token <|end_of_data|>, whose embed-
dings are randomly initialized and learnable. That is, we su-
pervise the filter to generate “Cleaned-Data<|end_of_data|>”.
Goal 4: Filter injections hidden in different positions
of the data. In agentic applications, the data could be long,
with tool outputs, files, websites, etc. A prompt injection can
be embedded in any position of the data. To fine-tune the
filter to be able to identify injections at any position, we put
the injection at different positions, following the insight in
[13]. Heuristically, we prepend an injection at the start of the
benign data in 20% of cases, append an injection at the end
of the benign data in 20% of cases, and insert an injection
at a uniformly random position between two tokens in the
benign data in 60% of cases. Even though we use non-agentic
Alpaca samples to construct our SFT dataset, the trained filter
generalizes to agentic settings as well, similar to [13].
We summarize the above details to construct our training
dataset of (prompt, data, output) triples in Algorithm 1. We
first include all benign samples in the dataset, so that the
filter learns to repeat the data if it is benign. Then, we use
straightforward, ignore, and completion attacks to simulate
prompt injections for each sample. Before injecting the attack,
we randomly truncate the data to prevent hallucinated com-
pletions. After that, we add a prompt injection in a random
position. Lastly, the desirable output ends with the added EOS
token to the filter model. Steps to obtain a DataFilter are:
1) Get an instruction tuning dataset D.
2) Construct the triples D′ by Algorithm 1. Format those
triples to an SFT dataset with our prompt template.
3) Fine-tune the filter model (from an Instruct LLM like
Llama-3.1-8B-Instruct) with this SFT dataset.
