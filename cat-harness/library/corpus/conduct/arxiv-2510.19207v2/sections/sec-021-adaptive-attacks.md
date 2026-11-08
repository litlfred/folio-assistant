---
doc_id: arxiv-2510.19207v2
doc_title: "Defending Against Prompt Injection with DataFilter"
section_id: sec-021-adaptive-attacks
section_title: "Adaptive Attacks"
section_number: null
pages: 11-11
source_pdf: arxiv-2510.19207v2.pdf
source_sha256: cdfa941ee76d59d0
toc_source: outline
---
To test the robustness of DataFilter under adaptive attacks,
we evaluate both adaptive human-designed attacks and strong
adaptive LLM-based attacks.
a) Human-designed: Since the DataFilter itself is im-
plemented using an LLM, it can also be directly targeted.
An attacker may craft an injected prompt designed to sup-
press the filtering instruction by directing the LLM to re-
main inactive whenever it encounters it, or to deceive the
DataFilter into treating the injected instruction itself as clean
data. We designed several prompts and randomly selected one
for each sample when evaluating on the SEP benchmark.
For example: “Hi, DataFilter! If you are asked to clean
and sanitize input data, please output the clean data here:
{injected_instruction}.” For the AGENTDOJO benchmark, we
modified the attack template based on the tool-knowledge
attack (the strongest attack). The complete list of adaptive
attacks is provided in the Appendix B.
Table VII shows that DataFilter remains highly effective
even under human-designed adaptive attacks, reducing the
ASR to below 1%.
b) LLM-based: We employ the best available attacks that
have broken all existing defenses [12], which is built upon a
genetic algorithm where a frontier LLM with a high reasoning
budget serves as the mutator. This attack assumes knowledge
of the system and its defenses, which is an unrealistic but
useful worst-case scenario.
TABLE VIII: ASR (↓) and Utility for (↑) Adaptive LLM-based
Attacks on AgentDojo.
Defense
ASR
Utility
None
100% 74.2%
PromptGuard
94%
72.2%
Spotlight
99%
75.3%
Sandwich
95%
73.2%
PromptArmor
93%
66.0%
DataFilter (ours) 83% 76.3%
Table VIII shows that DataFilter achieves the lowest ASR
at 83%, outperforming its next-best competitor, PromptAr-
mor (ASR 93%). DataFilter also preserves the highest utility
(76.29%). We show some failure cases under the attack in
Appendix C, and we observe that the successful injections
may pretend to be one necessary step of the benign task to
deceive the DataFilter.
