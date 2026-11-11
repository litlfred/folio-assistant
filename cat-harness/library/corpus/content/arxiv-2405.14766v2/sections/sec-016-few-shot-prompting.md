---
doc_id: arxiv-2405.14766v2
doc_title: "Evaluating Large Language Models for Public Health Classification and Extraction Tasks"
section_id: sec-016-few-shot-prompting
section_title: "Few-shot Prompting"
section_number: null
pages: 12-13
source_pdf: arxiv-2405.14766v2.pdf
source_sha256: 07248c8e1578d9ea
toc_source: outline
---
To investigate the potential impact of using more advanced prompting techniques on chal-
lenging tasks, we evaluate the impact of few-shot prompting on the hardest internal and
external classification tasks.
For the hardest of our internally annotated tasks, Contact Classification, we use a 10-shot
prompt illustrating how to apply the protocol in difficult edge cases. We find substantial
improvements across models, see Fig. 3. With the exception of Flan-T5-xxl and Llama-3.1-
8B, all other models see greater than 10 percentage point increases in micro-F1 scores over
the zero-shot setting.
Figure 3: Comparison of zero-shot and few-shot prompting on challenging tasks (Contact Clas-
sification). We compare the baseline zero-shot prompt to a 10-shot prompt for Contact Classification.
12
Figure 4: Comparison of zero-shot and few-shot prompting on challenging tasks (Health Causal
Claims Classification). We compare the baseline zero-shot prompt to a 7-shot prompt for Health
Causal Claims Classification.
Similarly, for the hardest of the externally annotated classification tasks, Health Causal
Claims Classification, we use a 7-shot prompt demonstrating the application of the definitions
to example sentences (see Fig. 7). Again with the notable exception of Flan-T5-xxl (which
performs strongly in the zero-shot setting), we also see a generally greater than 10 percentage
point increase in micro-F1 scores over the zero-shot baseline across models, see Fig. 4. Large
improvements in performance from few-shot prompting on this task were also found for
GPT-4 and GPT-3.5 in the original work by Chen et al. [51].
The relative performance of models also changes between the zero-shot and few-shot settings
for the two tasks. For example, Llama-3-8B-Instruct is the lowest performing model with
a zero-shot prompt but outperforms the Flan-T5-xxl and Mistral-7B-Instruct-v0.2 models
when using few-shot prompting.
An interesting feature of both of these classification tasks, and potentially why there are
significant gains from few-shot prompting, is that they require the LLM to make nuanced
distinctions between complex labels that are defined by the user within the prompt. This type
of task is particularly relevant for public health given the regular use of specific definitions
and protocols that often change over time.
3.4
