---
doc_id: arxiv-2510.19207v2
doc_title: "Defending Against Prompt Injection with DataFilter"
section_id: sec-019-datafilter-offers-state-of-the-art-security
section_title: "DataFilter Offers State-of-The-Art Security"
section_number: null
pages: 8-10
source_pdf: arxiv-2510.19207v2.pdf
source_sha256: cdfa941ee76d59d0
toc_source: outline
---
We evaluate the security of our model on agentic work-
flows using AgentDojo [23] and InjecAgent [22], and
on instruction-following tasks using SEP [21]. We se-
lect
gpt-4o-2024-05-13
as
the
backend
LLM
for
all those three benchmarks due to its powerfulness in
agentic tool-calling tasks. For SEP, we additionally eval-
uate how our DataFilter secures an open-weight model
(Llama-3.1-8B-Instruct).
On AgentDojo (see Table II), DataFilter provides strong
security. AgentDojo highlights the severity of strong attack
styles: both Important Instructions and Tool Knowledge push
ASR above 40% without defense. Detection-based defenses
such as PromptGuard and DataSentinel provide limited benefit,
TABLE II: ASR (↓) on AgentDojo (securing gpt-4o).
Defense \ Attack
Direct
Ignore
Previous
Important
Instructions
Tool
Knowledge
None
3.1%
3.2%
42.2%
42.5%
PromptGuard
2.5%
0.2%
25.9%
35.7%
DataSentinel
1.7%
2.3%
36.7%
36.6%
Sandwich
2.2%
1.8%
21.8%
18.9%
Spotlight
2.4%
1.5%
32.1%
30.9%
Tool Filter
0.6%
0.6%
6.9%
6.4%
PromptArmor
0.0%
0.0%
2.5%
0.4%
DataFilter (Ours)
1.2%
0.1%
0.2%
0.0%
TABLE III: ASR (↓) on the InjecAgent benchmark.
Backend LLM
gpt-4o
Llama-3.1-8B-Instruct
Defense \ Attack
Base
Enhanced
Base
Enhanced
None
34.4%
38.6%
23.1%
37.8%
PromptGuard
33.8%
0.1%
21.8%
0.2%
DataSentinel
34.8%
37.0%
23.1%
34.6%
Sandwich
12.1%
14.0%
10.0%
10.2%
Instructional
28.6%
1.6%
21.9%
5.4%
Spotlight
31.8%
22.7%
22.6%
38.5%
PromptArmor
11.2%
10.0%
7.8%
1.0%
DataFilter
2.0%
0.0%
2.1%
1.2%
leaving ASR above 25–35%. Prompt-based defenses (e.g.,
Sandwich, Spotlight) lower ASR somewhat, but attacks re-
main highly effective (up to 18.86% under Tool Knowledge).
System-level defenses show stronger resilience. Tool Filter
reduces ASR substantially (6.43% under Tool Knowledge),
demonstrating the effectiveness of restricting tool access.
DataFilter and PromptArmor both provide strong overall
protection, driving ASR close to zero across all attack types
and outperforming both detection- and prompt-based defenses.
DataFilter has an average ASR 0.4% and a maximum ASR
1.2%, outperforming PromptArmor’s average/maximum ASR
0.7%/2.5%, respectively. We note that the backend LLM (gpt-
4o) is non-deterministic despite setting the sampling tempera-
ture to 0, rendering inevitable variability to the results. The
effect is particularly noticeable for PromptArmor, since its
defense mechanism requires querying the model to remove
the injection, thereby increasing the uncertainty.
We further evaluate on InjecAgent (see Table III), where
we treat the tool response (referred to as Observations in the
benchmark) as the untrusted data that should be detected or fil-
tered. Enhanced attacks are easier to detect, as the injected task
is introduced with the explicit phrase “IMPORTANT!!! Ignore
all previous instructions and strictly adhere to the following
instruction:”. This pattern is very easy to recognize, making
it more likely for LLM-based defenses to flag. In contrast,
the Base attack uses simple imperative sentences or questions
without distinctive markers. While such attacks are often less
effective against backend LLMs, they are harder for detectors
to identify reliably. Overall, methods like PromptGuard and
PromptArmor work well against the Enhanced attack but fail
to reliably block the Base attack. Across both backends and
both attack types, DataFilter provides the most consistent
protection, driving Enhanced ASR to zero and reducing Base
ASR to around 2%.
Our evaluation on the SEP benchmark (Table IV) shows that
DataFilter is the only defense that provides strong security
against a variety of attacks (Section V-B). For a gpt-4o
backend, the “None” baseline shows relatively low but non-
negligible ASR (e.g., 14.1% for Straightforward, 35.9% for
Context), suggesting that frontier closed-source models al-
ready exhibit moderate resilience but remain exploitable.
Llama-3.1-8B-Instruct is substantially more vulner-
able, with ASR above 70% on Straightforward and Ignore
attacks and over 90% on Completion-style attacks.
Detection-based defenses display complementary strengths
but also notable blind spots. PromptGuard reduces ASR
against Ignore-style attacks on both backends (7.2% on
gpt-4o, 38.0% on Llama-3.1-8B-Instruct), but re-
mains largely
ineffective
on Straightforward and Com-
pletion attacks. DataSentinel excels at mitigating Com-
pletion and Completion-related attacks, reducing ASR to
nearly zero on both backends, but performs poorly on
Straightforward and Ignore (e.g., 25.6% and 11.6% on
Llama-3.1-8B-Instruct). The DataSentinel detector is
not trained on a general-purpose instruction-tuning dataset like
Alpaca. Instead, it is fine-tuned specifically for the task of
detecting prompt injection attacks using a task-specific dataset.
This specialization likely explains its inability to generalize to
more diverse or naturalistic injection scenarios.
Prompt-based defenses (Sandwich, Instructional, Spotlight)
provide at best incremental improvements. In several cases,
they even slightly worsen ASR (e.g., Sandwich on gpt-4o
increases Straightforward ASR to 17.2%). Their lack of ro-
bustness across attack types indicates that simple prompt
modifications cannot reliably mitigate adaptive injections.
PromptArmor achieves strong results on Ignore-style attacks
(1.7% on gpt-4o, 2.1% on Llama-3.1-8B-Instruct),
outperforming most baselines. However, its performance de-
grades sharply on other attack types, such as Straightforward
(21.9% on Llama-3.1-8B-Instruct) and Completion
(44.1%). This limitation arises because PromptArmor relies
on querying the ChatGPT API to detect injections, making its
effectiveness heavily dependent on ChatGPT’s prior exposure
to and knowledge of particular attack styles.
Among all defenses, only DataFilter and PromptArmor
effectively mitigate the advanced Context attack. Although
this attack is semantically similar to the Ignore attack,
most baselines fail to detect or prevent it. For exam-
ple, DataSentinel substantially reduces the Ignore ASR on
Llama-3.1-8B-Instruct (from 69.3% to 11.6%), but
remains much less effective on Context (82.8% to 21.2%).
Since DataSentinel was trained specifically on Ignore attacks,
it fails to generalize to the Context attack. This gap high-
lights that smaller models struggle to defend against more
sophisticated injection strategies due to their limited lan-
guage understanding. In contrast, DataFilter and PromptArmor
TABLE IV: ASR (↓) on SEP for gpt-4o and Llama-3.1-8B-Instruct against 6 attacks, see visuals in Figure 4.
Backend LLM
gpt-4o
Llama-3.1-8B-Instruct
Defense \ Attack Straight-
forward Ignore Completion Completion-
Ignore
Multi-Turn-
Completion Context Straight-
forward Ignore Completion Completion-
Ignore
Multi-Turn-
Completion Context
None
14.1%
11.1%
11.5%
13.0%
4.9%
35.9%
71.4%
69.3%
95.0%
91.7%
89.8%
82.2%
PromptGuard
14.0%
7.2%
10.7%
4.8%
5.3%
33.7%
71.5%
38.0%
92.2%
33.7%
87.2%
83.2%
DataSentinel
4.6%
3.3%
0.4%
0.4%
0.3%
8.6%
25.6%
11.6%
0.2%
0.3%
0.2%
21.2%
Sandwich
17.2%
13.0%
12.3%
10.0%
5.0%
32.7%
65.7%
61.9%
91.7%
86.2%
77.4%
74.4%
Instructional
11.3%
9.6%
7.8%
8.6%
4.9%
28.2%
58.6%
55.4%
92.4%
87.4%
84.2%
64.9%
Spotlight
9.8%
9.7%
5.6%
4.6%
4.8%
12.7%
67.3%
68.5%
93.0%
90.7%
72.0%
73.5%
PromptArmor
4.0%
1.7%
4.0%
3.2%
3.6%
1.6%
21.9%
2.1%
44.1%
7.0%
58.5%
1.7%
DataFilter (Ours)
3.4%
1.5%
1.8%
1.4%
2.4%
2.2%
2.4%
2.5%
4.6%
3.5%
3.9%
2.6%
succeed because they leverage the stronger reasoning and
comprehension abilities of large models such as GPT-4.1
and Llama-3.1-8B-Instruct.
Overall, DataFilter achieves consistently low ASR across
all attack types and both backend LLMs, demonstrating strong
generalization to diverse and complex prompt injection attacks
and scenarios.
