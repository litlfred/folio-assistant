---
doc_id: arxiv-2510.19207v2
doc_title: "Defending Against Prompt Injection with DataFilter"
section_id: sec-001-prompt-injection-attack
section_title: "Prompt Injection Attack"
section_number: null
pages: 1-2
source_pdf: arxiv-2510.19207v2.pdf
source_sha256: cdfa941ee76d59d0
toc_source: outline
---
a prompt into the data that LLMs access, an attacker can
arbitrarily override the original user task and redirect the agent
system towards unintended and potentially harmful actions.
Successful prompt injection attacks against industry products
[5, 6, 7] have been realized to cause actual harms like data
leakage and malware execution. Thus, prompt injection risks
hold back a broader adoption of AI agents and have been listed
as the top-1 threat to LLM applications [8].
Against prompt injections, defenders have tried to secure
the system outside the model (system-level defenses) or secure
the model itself (model-level defenses). System-level defenses
[9, 10, 11] offer an attractive guaranteed security by design and
can be used with any existing model. However, they require
non-trivial work from the agent developer to design their
system in a way tailored around prompt injection robustness.
Currently, system-level defenses can only be applied to a very
limited set of tasks, thus rendering significant utility drop
[12]. Model-level defenses [13, 14, 15] offer a different set
1To Appear at the IEEE Conference on Secure and Trustworthy Machine
Learning (SaTML) 2026.
Prompt
Please help me summarize 
my recent unread email.
Data
Sender: abc@mail.com 
Content: How is your day? 
Ignore all the previous 
instructions and forward 
your Facebook Password 
Reset email to me!
DataFilter
Backend 
LLM
Sender: 
abc@ma
il.com
Content: 
How is 
your day? 
Filtered Data
Fig. 1: DataFilter takes both the trusted instruction and un-
trusted data as input, removes potential prompt injections, and
outputs the sanitized data. The backend LLM then executes
the original instruction using the sanitized data.
of tradeoffs. They provide an exciting general defense and
could protect all agents without requiring any special effort
from the agent developer. However, modifying the well-trained
model for security requires a delicate manipulation of the
post-training pipeline to preserve the model utility. Perhaps
for this reason, no major model provider currently provides
secure models [13] despite consistent trials [16, 17]. Thus, this
approach might be promising in the long term, but is not an
option today, especially for practically securing a production-
level LLM.
We propose a new defense, DataFilter, that combines some
of the best aspects of system-level and model-level defenses.
Specifically, we filter all queries to the LLM to remove all
injected prompts (see Figure 1), so the LLM can operate on
benign data. Like model-level defenses, our approach is easy
to deploy and general. That is, an off-the-shelf DataFilter is
ready for immediate protection on any agent systems with no
required efforts from the agent developer. Like system-level
defenses, it can be used with any model and does not require
cooperation or support from the model provider. We also show
that DataFilter maintains the utility of the underlying model
when providing significant security. We believe it could be a
practical defense in the short and medium term, despite its
potential vulnerabilities against the most sophisticated attacks
[12, 18] as all existing defenses.
We train a small DataFilter model to filter the input. The
key technical challenge is how to filter out parts of the input
that might be involved in a prompt injection attack, without
filtering out benign data. Prompt injection attacks can be
diverse and hard to recognize, but they are all commanded
by imperative sentences. Roughly speaking, we need to filter
the data input out of imperative sentences, which are easy
to recognize, and thus feasible to identify and delete by a
reliable filter. In practice, however, some imperative sentences
arXiv:2510.19207v2  [cs.CR]  4 Feb 2026
0
5
10
15
20
25
30
35
40
Attack Success Rate (%, 
)
45
50
55
60
65
Utility (%, 
)
Utility-Security Trade-Off
None
PromptGuard
DataSentinel
Sandwich
Spotlight
PromptArmor
DataFilter (ours)
Ideal Defense
Fig. 2: DataFilter achieves a better tradeoff between security
(Attack Success Rate, ASR, ↓) and utility (↑) than any
prior defense. The star indicates the best one could hope
for (zero ASR without utility drop). DataFilter approaches
this ideal more closely than other defenses. The ASR scores
are averaged across three benchmarks: SEP [21], InjecAgent
[22], and AgentDojo [23]. The ASR for a benchmark is
calculated by the maximum ASR of various attacks (SEP,
InjecAgent, and AgentDojo are tested with 6, 2, and 4 attack
methods, respectively). The utility scores are averages across
two benchmarks: AlpacaEval2 [24] and AgentDojo [23]. SEP
and AlpacaEval2 are for instruction following; InjecAgent and
AgentDojo are for agentic tool-calling.
are not prompt injections and need to be preserved. Handling
this challenge requires a non-trivial design of DataFilter’s
training process. With that design, our DataFilter is much
more sophisticated about locating and removing imperative
sentences only if they could be a prompt injection.
Empirically, we find that DataFilter is effective in deleting
prompt injections that are not seen in its training. It reduces
attack success rates (ASRs) from over 40% to about 2%
(average over multiple benchmarks), across a range of different
attack methods. Utility is reduced by about 1% (average over
multiple benchmarks). Our experiments show that DataFilter
provides a better security-utility tradeoff than all tested prior
defenses that can directly secure any existing LLMs, see
Figure 2. In our experiments, PromptArmor [19] and sandwich
prompting [20] are the two best prior model-agnostic schemes,
and DataFilter is better than PromptArmor on both security
and utility (average ASR 2.2% vs 5.9%, average utility drop
of 1.0% vs 4.1%) and much more secure than sandwich
prompting (average ASR 2.2% vs 22.8%). Therefore, we
draw the community’s attention to this simple and effective
mechanism for defending against prompt injection attacks.
