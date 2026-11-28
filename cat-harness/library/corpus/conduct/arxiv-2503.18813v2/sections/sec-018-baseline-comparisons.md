---
doc_id: arxiv-2503.18813v2
doc_title: "Defeating Prompt Injections by Design"
section_id: sec-018-baseline-comparisons
section_title: "Baseline comparisons"
section_number: null
pages: 16-17
source_pdf: arxiv-2503.18813v2.pdf
source_sha256: c3719f6ce73eecf4
toc_source: outline
---
banking
slack
travel workspace
0.0
0.2
0.4
0.6
0.8
1.0
Utility
CaMeL
Prompt Sandwiching
Spotlighting
Tool Filter
Undefended model
(a) Utility, full results in Table 5
CaMeL
CaMeL (no policies)
Spotlighting
Tool Filter
Prompt Sandwiching
Undefended model
1
10
50
N of successful attacks
Data-flow
hijacked
(b) Number of successful attacks, full results in Table 7
Figure 11 | CaMeL’s security guarantees in practice. A comparison between CaMeL and other
defenses in terms of utility and number of successful attacks when using Claude 3.5 Sonnet. CaMeL
significantly outperforms all other defenses in terms of security while having a reasonable impact on
utility (the latter with the exception of the Travel suite). This highlights the effectiveness of CaMeL’s
approach of using explicit isolation and formal security policies. The total number of attacks is 949
and the y axis is symlog scale. In the left figure, only “CaMeL" is shown (and not “CaMeL (no policies)”
as policies do not affect utility. We also show the utility under attack in Figure 18.
We compare CaMeL with other defenses implemented in AgentDojo (Debenedetti et al., 2024b) run
with Claude 3.5 Sonnet. These defenses are: tool filter (Debenedetti et al., 2024b), spotlighting (Hines
et al., 2024), and prompt sandwiching (Learn Prompting, 2024). The results are shown in Figure 11.
We find that CaMeL significantly outperforms all other defenses in terms of security. For example, the
16
Defeating Prompt Injections by Design
the number of successful attacks with CaMeL is 0, while the number of successful attacks with the next
best defense (tool filter) is 8. Notably, the defenses use a model (Claude 3.5 Sonnet) which is already
not particularly vulnerable to AgentDojo’s default prompt attack. However, US-AISI (2025) showed
that, when attacked with adaptive prompts, the robustness of Claude 3.5 Sonnet drops drastically.
This implies that the same might happen with the other defenses, which are heuristic and do not
provide any guarantees.
Finally, we find that GPT-4o Mini, which uses the instruction hierarchy defense (Wallace et al., 2024;
OpenAI, 2024), still fails to defend against all attacks in AgentDojo. While GPT-4o Mini with CaMeL
is not vulnerable to any of the attacks in AgentDojo, GPT-4o-mini with the tool calling API (which
implements the instruction hierarchy by default) is vulnerable to 276 attacks.
This demonstrates that CaMeL’s approach of using explicit isolation, fine-grained capabilities, and
formal security policies is more effective than relying on learned instruction hierarchy alone. Impor-
tantly, CaMeL comes with security guarantees, while all other solutions currently are probabilistic
and provide no such guarantees, relying on the agents to make all the important security decisions.
Finally, CaMeL can and should be used in conjunction with other defenses to deliver defense in depth.
