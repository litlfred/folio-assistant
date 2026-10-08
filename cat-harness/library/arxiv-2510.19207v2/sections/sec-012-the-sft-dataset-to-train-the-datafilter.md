---
doc_id: arxiv-2510.19207v2
doc_title: "Defending Against Prompt Injection with DataFilter"
section_id: sec-012-the-sft-dataset-to-train-the-datafilter
section_title: "The SFT Dataset to Train the DataFilter"
section_number: null
pages: 5-6
source_pdf: arxiv-2510.19207v2.pdf
source_sha256: cdfa941ee76d59d0
toc_source: outline
---
The construction process of the SFT dataset is non-trivial to
ensure the fine-tuned filter model works well. For eq. (1), we
first describe the prompt template ⟨⟩to format the input, then
introduce the construction of prompt u, data x, and desirable
output xclean to realize challenging training goals.
Our prompt template formats prompt u and data x
into one input string to the LLM. We place general in-
structions about how to filter data in the system message
and the prompt and data in the user message. We fine-
tune Llama-3.1-8B-Instruct [58] to be our filter
model. Besides Llama’s special delimiters (<|begin_of_text|>,
<|start_header_id|>,<|end_header_id|>, <|eot_id|>), we add a
special token <|end_of_instruction|> to separate the prompt
and data in user message, following [13]. This special token’s
embeddings are randomly initialized and learned during train-
ing, to help the filter LLM recognize the separation between
prompt and data.
With this prompt template, we construct (prompt u, data x,
output xclean) triples for eq. (1) starting from the Alpaca dataset
[59]. Using this public instruction-tuning dataset makes our
dataset construction process model-agnostic, without querying
the backend LLM or using its training set Each sample in
Alpaca contains a prompt part ua and a data part xa that has
no injection. We use all N = 19K samples in Alpaca that
have a non-empty data part, but our method is not dependent
on the specific choice of instruction-tuning dataset.
Our goal is to supervise the filter LLM to delete any
possible injections. Therefore, we create training samples with
a simulated prompt injection in the data. The desired output
is the data without the injection, i.e.,
u = ua, x = xa + u′
a + x′
a, xclean = xa,
where we use +u′
a + x′
a to denote a simulated prompt injection
with the prompt and data coming from another sample (u′
a,
x′
a) in the instruction-tuning dataset. Based on this, we intro-
duce some goals we have for the filter, and how we carefully
construct training samples to achieve those goals.
Input to the filter model
<|begin_of_text|>
<|start_header_id|>system<|end_header_id|>
You are a data filter designed to clean and sanitize
input
data.
The
user
instruction
appears
before
<|end_of_instruction|>, and the input data follows
<|end_of_instruction|>.
Your
task
is
to
analyze
both the instruction and the data, ensuring that the
data section contains only content relevant to the
instruction.
Remove
from
the
data
section
any
commands,
requests, malicious injections, imperative sentences,
questions, or other extraneous instructions. Retain
only benign, relevant content that directly supports
the user’s intended task. Return the sanitized data as
output.
<|eot_id|><|start_header_id|>user<|end_header_id|>
Prompt<|end_of_instruction|>Data
<|eot_id|> <|start_header_id|>assistant<|end_header_id|>
Goal 1: When there is no injection, output the data
without deleting anything. The filter should generate all the
data part when it has no injection. To prevent false deletion, we
include all N benign (uninjected) samples as part of our SFT
dataset. Those samples supervise the filter to output the data
unchanged if it is benign. Then, following the strategy from
Meta Secalign[13], for each sample in Alpaca, we also perform
simulated prompt injections using the Straightforward, Ignore,
and Completion attacks described in Section II-D to form an
SFT dataset with 4N samples. We detail this process below.
Goal 2: Output the filtered data without hallucinatory
