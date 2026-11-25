---
doc_id: arxiv-2510.19207v2
doc_title: "Defending Against Prompt Injection with DataFilter"
section_id: sec-020-datafilter-preserves-utility
section_title: "DataFilter Preserves Utility"
section_number: null
pages: 10-11
source_pdf: arxiv-2510.19207v2.pdf
source_sha256: cdfa941ee76d59d0
toc_source: outline
---
A defense, when implemented, is expected to preserve the
utility of the system. In this subsection, we evaluate the
system’s utility under various defenses on agentic tool-calling
benchmark AgentDojo and instruction-following benchmark
AlpacaEval2.
On AgentDojo, we report the utility in Table V. We focus
on the benign utility (the agent’s ability to complete user tasks
correctly when no attack is present), and also test the utility
under attack (which measures the agent’s ability to complete
user tasks while avoiding execution of injected instructions).
Detection-based
defenses
such
as
PromptGuard
and
DataSentinel suffer from substantial utility degradation due
to false positives. In particular, DataSentinel exhibits severe
utility loss, as its high false-positive rate prevents the agent
from executing many benign tasks. In contrast, prompt-based
defenses generally preserve utility more effectively. For exam-
ple, the Sandwich defense even improves utility by reminding
the agent of the original user instruction after each tool call,
though this approach has bad security (see Table II), which is
consistent to [13]. PromptArmor also reduces utility because
it sometimes removes benign content unnecessarily.
DataFilter maintains competitive utility while achieving
strong security (Table II). Its high benign utility (79.4%, only
2% drop) confirms that DataFilter preserves useful content
when no attack is present, consistent with our design goal in
Section IV. At the same time, its strong utility under attack
demonstrates that DataFilter can precisely remove malicious
instructions while preserving the remaining benign data.
We plot the overall (benign) utility-security trade-off on
AgentDojo in Figure 3, using numbers from Table II and
Table V. Comparing with prior defenses, DataFilter is closest
to an ideal defense with zero ASR and utility drop.
TABLE V: Utility (↑) on AgentDojo (securing gpt-4o).
Defense \ Attack
None
Direct
Ignore
Previous
Important
Instructions
Tool
Knowledge
None
81.4%
72.9%
72.3%
46.7%
45.8%
PromptGuard
71.1%
72.8%
29.5%
35.7%
38.7%
DataSentinel
36.6%
63.0%
62.2%
45.1%
41.9%
Sandwich
82.5%
80.8%
78.1%
68.3%
69.3%
Spotlight
77.3%
71.6%
72.7%
55.9%
55.1%
Tool Filter
68.0%
68.0%
67.7%
62.1%
65.9%
PromptArmor
72.2%
70.0%
69.3%
67.1%
67.7%
DataFilter (Ours)
79.4%
73.1%
72.7%
72.5%
72.4%
0
10
20
30
40
Attack Success Rate (%, 
)
40
50
60
70
80
Utility (%, 
)
AgentDojo Utility-Security Trade-Off
None
PromptGuard
DataSentinel
Sandwich
Spotlight
PromptArmor
DataFilter (ours)
ToolFilter
Ideal Defense
Fig. 3: Utility–security trade-offs on AgentDojo. The star
indicates the best defense could hope for (zero ASR without
utility drop). DataFilter approaches this ideal more closely
than all other tested defenses. The utility is tested without
any attack. The ASR is the maximum ASR of 4 tested attacks
on AgentDojo.
We report utility on AlpacaEval2 for general instruction-
following tasks in Table VI, using gpt4_1106_preview
as the reference model as officially recommended. Following
[63], we use the length-controlled WinRate (↑) metric to
account for verbosity bias. Overall, almost all baselines exhibit
negligible utility degradation on AlpacaEval2. This bench-
mark consists of relatively simple tasks that do not trigger
false alarms in detection-based defenses (e.g., DataSentinel,
TABLE VI: Utility (↑) on the AlpacaEval2 benchmark.
Defense \ Backend LLM gpt-4o Llama-3.1-8B-Instruct
None
54.0%
25.9%
PromptGuard
53.6%
26.0%
DataSentinel
53.6%
25.4%
Sandwich
54.2%
22.4%
Instructional
54.1%
24.3%
Spotlight
53.1%
22.6%
PromptArmor
55.1%
25.9%
DataFilter (Ours)
54.1%
26.2%
TABLE VII: ASR (↓) for Adaptive Human-Designed Attacks.
DataFilter remains effective against adaptive human-designed
attacks.
Benchmark
Backend LLM
No Defense With DataFilter
AgentDojo
GPT-4o
15.7%
0.0%
SEP
GPT-4o
72.2%
1.0%
SEP
Llama-3.1-8B-Instruct
77.6%
0.3%
PromptGuard) or filtering defenses (e.g., DataFilter, Promp-
tArmor), allowing them to preserve utility nearly perfectly. In
contrast, defenses that modify the input text (such as Sandwich
and Spotlight) introduce additional formatting or contextual
changes that can slightly influence the model’s output, leading
to modest but consistent utility reductions. We attribute the
score differences in Table VI mostly to random variance, e.g.,
on gpt-4o’s randomness as discussed in Section V-E.
