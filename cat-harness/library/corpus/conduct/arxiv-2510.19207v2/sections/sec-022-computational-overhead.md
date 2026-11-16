---
doc_id: arxiv-2510.19207v2
doc_title: "Defending Against Prompt Injection with DataFilter"
section_id: sec-022-computational-overhead
section_title: "Computational Overhead"
section_number: null
pages: 11-11
source_pdf: arxiv-2510.19207v2.pdf
source_sha256: cdfa941ee76d59d0
toc_source: outline
---
TABLE IX: Cost and Latency Overhead of DataFilter.
Model
Cost
Wall-Clock Time
GPT-5.1
$0.0140
14.17s
GPT-5.1 + DataFilter
$0.0145
(+3.7%)
14.74s
(+4.0%)
GPT-4o
$0.0427
3.0237s
GPT-4o + DataFilter
$0.0431
(+1.0%)
3.5515s
(+17.5%)
We show that DataFilter introduces marginal monetary and
latency overhead. To reduce the estimation bias from model
serving platforms, we calculate the runtime costs of DataFilter
and the backend LLM based on industry-level LLM server
statistics. OpenRouter provides competitive services on the
inference of Llama-3.1-8B-Instruct [66], the architecture of
our filter model. OpenAI has leading services on backend
models such as gpt-4o [67] and gpt-5.1 [68]. The numbers
are estimated using AgentDojo’s 97 samples. Wall-clock time
is computed as N · Tlat + O/R, where N is the number of
calls, Tlat is latency (time to first token), O is output tokens,
and R is throughput. Costs are calculated as I · Pin + O · Pout,
where I is input tokens and Pin, Pout are the respective token
prices.
As shown in Table IX, the cost and latency overhead
introduced by DataFilter is marginal, with additional monetary
cost below $0.0005 per sample and additional inference time
under 0.60s per sample.
