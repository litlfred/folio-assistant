---
doc_id: arxiv-2510.19207v2
doc_title: "Defending Against Prompt Injection with DataFilter"
section_id: sec-023-conclusion-and-discussions
section_title: "Conclusion and Discussions"
section_number: null
pages: 11-16
source_pdf: arxiv-2510.19207v2.pdf
source_sha256: cdfa941ee76d59d0
toc_source: outline
---
Our work shows that it is possible to defend a black-box
commercial LLM and preserve its utility by using another
trained LLM to filter malicious injections from the data.
DataFilter delivers a good balance of security, utility, and
deployability. Even though it is trained only on basic attacks,
it generalizes effectively to more complex injection strate-
gies. Similarly, our method transfers well to unseen domains:
trained on Cleaned-Alpaca [69] (a single-turn instruction-
tuning dataset), it generalizes to agentic benchmarks [22,
23] involving multi-turn tool calls in sandbox environments.
Across multiple benchmarks, DataFilter consistently reduces
attack success rates to near zero, outperforming detection- and
prompt-based defenses, which either over-refuse benign inputs
or miss attacks. Unlike system-level defenses, it requires no
redesign of the agent or application and can be deployed
in a plug-and-play manner to both commercial and open-
weight models. Most importantly, DataFilter achieves these
gains without sacrificing utility, maintaining task performance
within a few percentage points (2%) of the undefended model.
Together, these findings confirm that DataFilter is the first
model-agnostic defense to simultaneously satisfy all three
desiderata outlined in Section IV.
Balance between security and utility. Utility in this setting
can be understood as the model’s ability to faithfully follow
user instructions. However, this same instruction-following
capability also creates vulnerability: an attacker can hide mali-
cious instructions in the data part, and a highly obedient model
may execute them as if they were legitimate. This inherent
tension gives rise to the utility-security trade-off: defenses that
aggressively block suspicious content often reduce benign task
success, while defenses that preserve utility risk leaving the
system exploitable. Our own preliminary experiments illustrate
this trade-off. When we trained a filter without providing the
user’s prompt as context, the model achieved perfect security
on AgentDojo (0% ASR across all attacks) simply by discard-
ing every imperative or instruction-like sentence. However,
this came at the cost of utility, as many benign imperative
sentences were also removed. Recent training-time defenses,
such as fine-tuning with defensive objectives [13, 51], have
shown that it is possible to balance this trade-off when model
weights are available and sufficient resources can be invested.
However, commercial providers, who compete heavily on
benchmark utility scores, are unwilling to sacrifice benign task
performance, and no robust models are currently offered. To
date, no work has shown a practical defense that achieves
this balance for black-box LLMs. DataFilter fills this gap by
achieving strong security against prompt injection while pre-
serving high utility, offering the first deployable defense that
reconciles the utility-security trade-off in black-box settings.
Enhancing the generalization ability of defenses. A key
challenge for prompt injection defenses is moving beyond
memorizing narrow attack patterns toward robustly identifying
malicious instructions in diverse contexts. Some attacks dis-
guise themselves in benign-looking structures—for example,
the Context attack introduced in Section V-B. If a defense only
learns to recognize obvious surface cues such as “ignore the
previous instructions”, it will fail to generalize to these subtler
strategies. Our findings suggest two promising directions.
First, training on more diverse and general datasets enables the
defense to capture general linguistic cues of injections rather
than overfitting to specific templates. Second, leveraging larger
backbone models provides stronger language understanding,
which allows the defense to reason about whether a sentence
is truly malicious or benign, instead of relying on superficial
features. Together, these factors enhance the generalization
ability of defenses, enabling them to handle previously unseen
or more sophisticated injection strategies.
Limitations. Our method still has below limitations. First,
DataFilter introduces additional inference overhead, since
the filter must run whenever new untrusted data is re-
ceived. Second, our defense cannot defend against the strong
optimization-based adaptive attacks. As discussed in Sec-
tion VIII, a recent strong attack [12] breaks our defense, as
it breaches all existing defenses. Third, while deployment is
lightweight, some effort is still required from agent developers.
In particular, DataFilter struggles with very long benign user
prompts. Therefore, applications that use very long user mes-
sages should provide the filter message with a more concise
user command, rather than the full user message. For example,
in InjecAgent [22], the user message contains the user’s actual
query together with tool introductions, example calls, and
policies. Our filter model performs poorly if provided the
entire user message but performs well if given the user’s query.
Developers must therefore extract the short user instruction
and pass it to DataFilter. Although this effort is modest, it
does add an extra integration step compared to defenses fully
embedded in the model.
Position of DataFilter.
Recent defenses on prompt in-
jection defense largely focus on system-level defense and
model-level defense. System-level defenses redesign the agent
pipeline to block prompt injection. Their strength is that they
can provide strong protection and can be used with any model,
since they work outside the LLM itself [9, 11]. But they
require non-trivial engineering work from the developer, and
not all types of tasks can be protected in this way. Model-level
defenses try to make the model itself resistant to injection,
usually through fine-tuning. If this worked well, it would be
the cleanest solution, since every agent built on the model
would automatically be protected. The problem is that it is
very hard to train models that are both robust and still maintain
high utility. No major provider currently offers such a robust
model [13], so this direction is seen as promising for the long
term but not realistic today.
Our DataFilter combines the advantages of both. Like
system-level defenses, it is easy to deploy, it can be used for
any task, and can be used to protect any backend model. The
trade-off is that it may not yet match the absolute strongest
protection possible with model-level defenses, but it offers a
practical, short- to medium-term option that balances security
and utility.
ACKNOWLEDGMENTS
This work was supported by the KACST-UC Berkeley
Center of Excellence for Secure Computing, the NSF ACTION
center through NSF grant 2229876, and by generous gifts
from Google, Meta, and Noyce foundation. We thank Chawin
Sitawarin for providing the results of the adaptive attack
reported in Table VIII.
REFERENCES
[1] Anthropic, “Introducing computer use, a new claude 3.5
sonnet, and claude 3.5 haiku,” https://www.anthropic.
com/news/3-5-models-and-computer-use, 2024.
[2] OpenAI, “Operator system card,” https://openai.com/
index/operator-system-card/, 2025.
[3] K. Greshake, S. Abdelnabi, S. Mishra, C. Endres,
T. Holz, and M. Fritz, “Not what you’ve signed up for:
Compromising real-world llm-integrated applications
with indirect prompt injection,” in Proceedings of the
16th ACM Workshop on Artificial Intelligence and
Security, 2023. [Online]. Available: https://doi.org/10.
1145/3605764.3623985
[4] F. Perez and I. Ribeiro, “Ignore previous prompt: Attack
techniques for language models,” in NeurIPS ML Safety
Workshop, 2022.
[5] J.
Rehberger,
“Zombais:
From
prompt
injection
to
c2
with
claude
computer
use,”
https://embracethered.com/blog/posts/2024/
claude-computer-use-c2-the-zombais-are-coming,
2024.
[6] E. T. Red, “Chatgpt operator: Prompt injection exploits
& defenses,” https://embracethered.com/blog/posts/2025/
chatgpt-operator-prompt-injection-exploits, 2025.
[7] J. Rehberger, “Hacking google bard - from prompt injec-
tion to data exfiltration,” https://embracethered.com/blog/
posts/2023/google-bard-data-exfiltration, 2023.
[8] OWASP, “2025 Top 10 Risk & Mitigations for LLMs
and Gen AI Apps,” https://genai.owasp.org/llm-top-10/,
2025.
[9] E. Debenedetti, I. Shumailov, T. Fan, J. Hayes, N. Carlini,
D. Fabian, C. Kern, C. Shi, A. Terzis, and F. Tramèr,
“Defeating prompt injections by design,” arXiv preprint
arXiv:2503.18813, 2025.
[10] H. An, J. Zhang, T. Du, C. Zhou, Q. Li, T. Lin, and S. Ji,
“Ipiguard: A novel tool dependency graph-based defense
against indirect prompt injection in llm agents,” arXiv
preprint arXiv:2508.15310, 2025.
[11] L. Meng, H. Feng, and E. Fernandes, “cellmate: Sand-
boxing browser ai agents,” https://www.earlence.com/
blog.html#/post/cellmate, 2025.
[12] M. Nasr, N. Carlini, C. Sitawarin, S. V. Schulhoff,
J. Hayes, M. Ilie, J. Pluto, S. Song, H. Chaudhari,
I. Shumailov et al., “The attacker moves second: Stronger
adaptive attacks bypass defenses against llm jailbreaks
and prompt injections,” arXiv preprint arXiv:2510.09023,
2025.
[13] S. Chen, A. Zharmagambetov, D. Wagner, and C. Guo,
“Meta SecAlign: A Secure Foundation LLM Against
Prompt Injection Attacks,” arXiv:2507.02735, 2025.
[14] S. Chen, J. Piet, C. Sitawarin, and D. Wagner, “StruQ:
Defending against prompt injection with structured
queries,” in USENIX Security Symposium, 2025.
[15] S. Chen, A. Zharmagambetov, S. Mahloujifar, K. Chaud-
huri, D. Wagner, and C. Guo, “SecAlign: Defending
against prompt injection with preference optimization,”
in The ACM Conference on Computer and Communica-
tions Security (CCS), 2025.
[16] E. Wallace, K. Xiao, R. Leike, L. Weng, J. Heidecke, and
A. Beutel, “The Instruction Hierarchy: Training LLMs
to Prioritize Privileged Instructions,” arXiv:2404.13208,
2024.
[17] C. Shi, S. Lin, S. Song, J. Hayes, I. Shumailov, I. Yona,
J. Pluto, A. Pappu, C. A. Choquette-Choo, M. Nasr et al.,
“Lessons from defending gemini against indirect prompt
injections,” arXiv preprint arXiv:2505.14534, 2025.
[18] Y. Wen, A. Zharmagambetov, I. Evtimov, N. Kokhlikyan,
T. Goldstein, K. Chaudhuri, and C. Guo, “Rl is a ham-
mer and llms are nails: A simple reinforcement learn-
ing recipe for strong prompt injection,” arXiv preprint
arXiv:2510.04885, 2025.
[19] T. Shi, K. Zhu, Z. Wang, Y. Jia, W. Cai, W. Liang,
H. Wang, H. Alzahrani, J. Lu, K. Kawaguchi, B. Alomair,
X. Zhao, W. Y. Wang, N. Gong, W. Guo, and D. Song,
“PromptArmor: Simple yet effective prompt injection
defenses,” arXiv preprint arXiv:2507.15219, 2025.
[20] S. Schulhoff and F. Yanni, “Learn prompting,” https://
learnprompting.org, 2023.
[21] E. Zverev, S. Abdelnabi, M. Fritz, and C. H. Lampert,
“Can llms separate instructions from data? and what do
we even mean by that?” in International Conference on
Learning Representations (ICLR), 2025.
[22] Q. Zhan, Z. Liang, Z. Ying, and D. Kang, “InjecA-
gent: Benchmarking indirect prompt injections in tool-
integrated large language model agents,” in Findings
of the Association for Computational Linguistics: ACL
2024, 2024.
[23] E. Debenedetti, J. Zhang, M. Balunovi´c, L. Beurer-
Kellner, M. Fischer, and F. Tramèr, “Agentdojo: A dy-
namic environment to evaluate attacks and defenses for
llm agents,” in Advances in Neural Information Process-
ing Systems (NeurIPS), 2024.
[24] X. Li, T. Zhang, Y. Dubois, R. Taori, I. Gulrajani,
C. Guestrin, P. Liang, and T. B. Hashimoto, “AlpacaEval:
An Automatic Evaluator of Instruction-following Mod-
els,” https://github.com/tatsu-lab/alpaca_eval, 2023.
[25] Salesforce, “Slack ai,” https://slack.com/features/ai.
[26] PromptArmor, “Data exfiltration from slack ai via in-
direct prompt injection,” https://promptarmor.substack.
com/p/data-exfiltration-from-slack-ai-via, 2024.
[27] “Introducing
operator,”
https://openai.com/index/
introducing-operator, 2025.
[28] Perplexity, “Comet browser: A personal ai assistant,”
https://www.perplexity.ai/comet, 2025.
[29] Brave, “Agentic browser security: Indirect prompt in-
jection in perplexity comet,” https://brave.com/blog/
comet-prompt-injection, 2025.
[30] A. Zou, Z. Wang, N. Carlini, M. Nasr, J. Z. Kolter, and
M. Fredrikson, “Universal and transferable adversarial
attacks on aligned language models,” arXiv preprint
arXiv:2307.15043, 2023.
[31] OpenAI, “GPT-5 system card,” https://openai.com/index/
gpt-5-system-card, 2025.
[32] Anthropic,
“System
card:
Claude
sonnet
4.5,”
https://assets.anthropic.com/m/12f214efcc2f457a/
original/Claude-Sonnet-4-5-System-Card.pdf, 2025.
[33] T. Vincent, “New prompt injection attacks spotted in bing
chat and copilot sidebar,” 2023, SecurityWeek.
[34] “Cve-2025-32711: Echoleak – email-based prompt in-
jection in microsoft 365 copilot,” https://cve.mitre.org/
cgi-bin/cvename.cgi?name=CVE-2025-32711, 2025, ac-
cessed: 2025-09-22.
[35] Y. Liu, Y. Jia, R. Geng, J. Jia, and N. Z. Gong, “For-
malizing and benchmarking prompt injection attacks and
defenses,” in USENIX Security Symposium, 2024.
[36] S. Willison, “Prompt injection attacks against GPT-3,”
https://simonwillison.net/2022/Sep/12/prompt-injection/,
Sep. 2022.
[37] X. Liu, Z. Yu, Y. Zhang, N. Zhang, and C. Xiao, “Auto-
matic and universal prompt injection attacks against large
language models,” arXiv preprint arXiv:2403.04957,
2024.
[38] D. Pasquini, M. Strohmeier, and C. Troncoso, “Neural
exec: Learning (and learning from) execution triggers
for prompt injection attacks,” in Proceedings of the 2024
Workshop on Artificial Intelligence and Security, 2024,
pp. 89–100.
[39] I. Evtimov, A. Zharmagambetov, A. Grattafiori, C. Guo,
and K. Chaudhuri, “WASP: Benchmarking web agent
security against prompt injection attacks,” in Advances in
Neural Information Processing Systems (NeurIPS), 2025.
[40] Z. Liao, J. Jones, L. Jiang, E. Fosler-Lussier, Y. Su,
Z. Lin, and H. Sun, “Redteamcua: Realistic adversarial
testing of computer-use agents in hybrid web-os environ-
ments,” arXiv preprint arXiv:2505.21936, 2025.
[41] Meta,
“Prompt
guard,”
https://llama.meta.com/docs/
model-cards-and-prompt-formats/prompt-guard, 2024.
[42] Y. Liu, Y. Jia, J. Jia, D. Song, and N. Z. Gong, “Datasen-
tinel: A game-theoretic detection of prompt injection
attacks,” in IEEE Symposium on Security and Privacy,
2025.
[43] H. Lin, Y. Lao, T. Geng, T. Yu, and W. Zhao, “Uni-
Guardian: A unified defense for detecting prompt injec-
tion, backdoor attacks and adversarial attacks in large
language models,” arXiv preprint arXiv:2502.13141,
2025.
[44] A. Vaswani, N. Shazeer, N. Parmar, J. Uszkoreit,
L. Jones, A. N. Gomez, L. Kaiser, and I. Polosukhin,
“Attention is all you need,” 2017.
[45] F.
Zarfati,
“Prompt
shields
in
azure
ai,”
https://techcommunity.microsoft.
com/t5/ai-azure-ai-services-blog/
azure-ai-announces-prompt-shields-for-jailbreak-and-indirect/
ba-p/4099140, 2024.
[46] T. Wu, S. Zhang, K. Song, S. Xu, S. Zhao, R. Agrawal,
S. R. Indurthi, C. Xiang, P. Mittal, and W. Zhou, “In-
structional segment embedding: Improving llm safety
with instruction hierarchy,” in International Conference
on Learning Representations (ICLR), 2025.
[47] Z. Wei, Y. Wang, and Y. Wang, “Jailbreak and guard
aligned language models with only few in-context
demonstrations,” in International Conference on Machine
Learning (ICML), 2024.
[48] S.
Schulhoff,
“Sandwich
defense,”
https:
//learnprompting.org/docs/prompt_hacking/defensive_
measures/sandwich_defense, 2024.
[49] T. Wu, C. Xiang, J. T. Wang, and P. Mittal, “Effectively
controlling reasoning models through thinking interven-
tion,” arXiv preprint arXiv:2503.24370, 2025.
[50] J. Yi, Y. Xie, B. Zhu, K. Hines, E. Kiciman, G. Sun,
X. Xie, and F. Wu, “Benchmarking and defending against
indirect prompt injection attacks on large language mod-
els,” arXiv:2312.14197, 2023.
[51] S. Chen, Y. Wang, N. Carlini, C. Sitawarin, and D. Wag-
ner, “Defending against prompt injection with a few
defensivetokens,” in ACM Workshop on Artificial Intelli-
gence and Security, 2025.
[52] K. Zhu, X. Yang, J. Wang, W. Guo, and W. Y. Wang,
“MELON: Provable defense against indirect prompt in-
jection attacks in ai agents,” in International Conference
on Machine Learning (ICML), 2025.
[53] S. Willison, “The dual llm pattern for building ai
assistants that can resist prompt injection,” https://
simonwillison.net/2023/Apr/25/dual-llm-pattern/, 2023.
[54] Y. Wu, F. Roesner, T. Kohno, N. Zhang, and U. Iqbal,
“IsolateGPT: An Execution Isolation Architecture for
LLM-Based Agentic Systems,” in Network and Dis-
tributed System Security (NDSS) Symposium, 2025.
[55] Y. Jia, Y. Liu, Z. Shao, J. Jia, and N. Z. Gong, “Prompt-
locate: Localizing prompt injection attacks,” in IEEE
Symposium on Security and Privacy, 2026.
[56] K. Hines, G. Lopez, M. Hall, F. Zarfati, Y. Zunger,
and E. Kiciman, “Defending against indirect prompt
injection
attacks
with
spotlighting,”
arXiv
preprint
arXiv:2403.14720, 2024.
[57] H. Kwong and N. Yorke-Smith, “Detection of imperative
and declarative question-answer pairs in email conver-
sations,” in International Joint Conference on Artificial
Intelligence (IJCAI), 2009, p. 1519–1524.
[58] Meta AI, “Introducing llama 3.1: Our most capable mod-
els to date,” https://ai.meta.com/blog/meta-llama-3-1/,
2024, accessed: 2025-09-24.
[59] R. Taori, I. Gulrajani, T. Zhang, Y. Dubois, X. Li,
C. Guestrin, P. Liang, and T. B. Hashimoto, “Stanford
Alpaca: An Instruction-following LLaMA model,” https:
//github.com/tatsu-lab/stanford_alpaca, 2023.
[60] Z. Ji, N. Lee, R. Frieske, T. Yu, D. Su, Y. Xu, E. Ishii,
Y. J. Bang, A. Madotto, and P. Fung, “Survey of halluci-
nation in natural language generation,” ACM Computer
Survey, vol. 55, no. 12, 2023.
[61] D. AI, “Zero,” https://deepspeed.readthedocs.io/en/latest/
zero3.html.
[62] Y. Dubois, C. X. Li, R. Taori, T. Zhang, I. Gulrajani,
J. Ba, C. Guestrin, P. S. Liang, and T. B. Hashimoto,
“Alpacafarm: A simulation framework for methods that
learn from human feedback,” in Advances in Neural
Information Processing Systems (NeurIPS), 2024.
[63] Y. Dubois, B. Galambosi, P. Liang, and T. B. Hashimoto,
“Length-controlled alpacaeval: A simple way to debias
automatic evaluators,” arXiv preprint arXiv:2404.04475,
2024.
[64] W.-L. Chiang, L. Zheng, Y. Sheng, A. N. Angelopoulos,
T. Li, D. Li, B. Zhu, H. Zhang, M. Jordan, J. E. Gonzalez
et al., “Chatbot Arena: An Open Platform for Evaluating
LLMs by Human Preference,” in International Confer-
ence on Machine Learning (ICML), 2024.
[65] S. Kariyappa and G. E. Suh, “Stronger enforcement of
instruction hierarchy via augmented intermediate repre-
sentations,” arXiv preprint arXiv:2505.18907, 2025.
[66] OpenRouter, “Llama 3.1 8b instruct - apl, providers,
stats openrouter.” [Online]. Available: https://openrouter.
ai/meta-llama/llama-3.1-8b-instruct
[67] ——,
“Chatgpt
4o
-
apl,
providers,
stats
openrouter.” [Online]. Available: https://openrouter.ai/
openai/chatgpt-4o-latest
[68] ——, “Gpt 5.1 - apl, providers, stats openrouter.”
[Online]. Available: https://openrouter.ai/openai/gpt-5.1
[69] G.
Ruebsamen,
“Cleaned
Alpaca
Dataset,”
Feb.
2024. [Online]. Available: https://github.com/gururise/
AlpacaDataCleaned
