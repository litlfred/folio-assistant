---
doc_id: arxiv-2406.01940v2
doc_title: "Work in progress PROCESS-DRIVEN AUTOFORMALIZATION IN LEAN 4"
section_id: sec-047-detailed-analyses-of-existing-llms-on-forml4
section_title: "Detailed Analyses of Existing LLMs on FormL4"
section_number: null
pages: 32-32
source_pdf: 2406.01940v2.pdf
source_sha256: 1cfc906589df5afc
toc_source: outline
---
The emergence of LLMs has fostered advancements in autoformalization tasks, where natural
language descriptions are converted into formal, programmable constructs. In this analysis, we
examine how various LLMs, benchmarking them across three different tests: Random, Basic, and
Real proposed by FORML4.
As shown in Table 15, there is a distinguishing performance divide between closed-source and
open-source LLMs. Closed-source models like GPT-4 and GPT-3.5 display substantially higher
Greedy and Pass@k scores across all tests compared to open-source LLMs. For instance, GPT-4
achieves a Greedy score of 10.20% in the Real Test, whereas the highest corresponding score for an
open-source model (InternLM-Math-7B) is only 1.10%. Focusing on open-source LLMs, DeepSeek-
Math-Instruct-7B stands out, particularly in the Random Test with a Greedy score of 0.58% and
a Pass@5 score of 1.71%. This model’s performance suggests a basic understanding of Lean 4
formalizations, even though it falls behind the scores of closed-source LLMs.
On the other end of the spectrum, LLEMMA-7B and LLEMMA-34B models display negligible
results in the Real Test. Their zero scores across all three metrics suggest that these models may not
have effectively integrated Lean 4 formalization capabilities into their architectures or training data.
Finally, size seems to play a less significant role in autoformalization tasks, as evidenced by consis-
tently low scores across models of varying sizes, from 7B to 34B parameters. This indicates that
simply increasing the model size doesn’t necessarily lead to better performance in specialized tasks
such as autoformalization in Lean 4.
Despite the progress made by both open-source and closed-source LLMs in the area of autoformal-
ization, our analysis identifies a consistent need for enhancement across the board. While certain
closed-source models demonstrate superior performance, the opportunity for improvement remains
vast, particularly within the open-source domain. We, therefore, propose FORML4 encompassing
both training and testing sets tailored for evaluating and improving autoformalization capabilities.
32
