---
doc_id: arxiv-2601.04544v1
doc_title: "TCAndon-Router: Adaptive Reasoning Router for Multi-Agent Collaboration"
section_id: sec-015-multi-agent-collaboration-analysis
section_title: "Multi-Agent Collaboration Analysis"
section_number: null
pages: 10-15
source_pdf: arxiv-2601.04544v1.pdf
source_sha256: 5472dcd690fe1c89
toc_source: outline
---
Multi-agent collaboration effectively supplements information from different perspectives. In Tencent
Cloud troubleshooting scenarios, multiple agents are often required to jointly diagnose and resolve issues,
as a single agent is typically insuﬀicient. Moreover, the Refining Agent demonstrates strong capability in
reconciling conflicting responses. With RAG support, the Refining Agent compares and filters multiple
candidate answers using the knowledge base, enabling conflicting opinions to converge. For instance, in
troubleshooting scenarios localization tasks, partial correctness from different agents can be combined
to form a complete solution—something a single agent cannot achieve.
5.3
Eﬀiciency and Cost Analysis
We further evaluate the deployment cost of TCAR in online environments. (1) The number of selected
agents is far below the theoretical maximum. Although multi-agent outputs are supported, the
actual average number of routed agents is only 1.37, indicating that most queries can be solved by a
single agent and that the model naturally favors concise predictions. (2) The latency impact of the
reasoning chain is well controlled. For a 4B model deployment requirements remain modest; the
average reasoning length is under 100 tokens. When deployed on GPUs, the average latency is less than
1 second, which is entirely acceptable. (3) The incremental cost of downstream collaboration is
small. Because the number of selected agents is low, downstream execution incurs an average overhead
equivalent to only 0.37 additional agent calls—far below any risk of combinatorial explosion.
6
Limitations
Although TCAR demonstrates stable and significant performance improvements across multiple public
datasets and real-world enterprise scenarios, several limitations remain that warrant attention in future
work.
Dependence on the quality of agent descriptions. TCAR’s routing reasoning relies on manually
written agent descriptions, which serve as the semantic foundation for constructing reasoning chains.
When these descriptions are overly brief, ambiguous, or fail to fully represent the true scope of an
agent’s responsibilities, the resulting reasoning chain may deviate from the intended semantics, ultimately
affecting routing accuracy. Although reinforcement learning improves the model’s robustness to noise in
descriptions, the overall quality of these descriptions remains a critical factor influencing performance.
Challenges in long-tail knowledge and domain transfer. For low-frequency or highly domain-
specific scenarios (e.g., rare APIs or special network configurations), the model may still exhibit instability
due to insuﬀicient training samples. Furthermore, when the instruction format is heavily modified, the
model’s instruction-following capability may degrade. If the instructions are substantially altered, an
additional round of fine-tuning on domain-specific private data becomes a more reasonable strategy.
Overall, these limitations do not undermine TCAR’s effectiveness in mainstream routing tasks or real
enterprise deployments, but they highlight promising directions for future research aimed at improving
robustness, generalization, and performance under extreme or specialized conditions.
7
Conclusion
This paper addresses the prevalent challenges in real-world multi-agent enterprise systems, including
agent conflicts, cross-domain intent ambiguity, and limited interpretability.
We propose TCAR, a
reasoning-centric multi-agent routing framework. By explicitly generating a natural-language reasoning
chain, TCAR extends traditional single-agent classification into a flexible subset prediction over all po-
tentially relevant agents, significantly enhancing the coverage and interpretability of routing decisions.
Building on this, we further design a downstream multi-agent collaborative execution mechanism and a
Refining Agent that consolidates multiple agent outputs, enabling the system to harness complementary
expertise across complex or cross-domain tasks.Experiments on multiple public datasets and large-scale
real ITSM data from Tencent Cloud demonstrate that TCAR achieves substantial improvements in
task accuracy, recall under conflict-prone scenarios, and the final answer quality resulting from multi-
agent collaboration. Ablation studies further validate the effectiveness of reasoning chains, reinforcement
10
TCAndon-Router
learning, and the SLERP-based model fusion strategy. Meanwhile, our analyses reveal key factors in-
fluencing model performance, including reasoning-chain structure, agent description quality, and the
sparsity of long-tail domain knowledge.In summary, TCAR highlights the feasibility and practical value
of a reasoning-driven, multi-agent collaborative routing paradigm in large-scale enterprise environments.
For future work, we plan to explore structured reasoning-chain constraints, more eﬀicient collaboration
protocols, and low-cost expansion strategies for emerging business domains to further enhance robustness
and generalization in complex real-world scenarios.
11
TCAndon-Router
References
[1] Ali Dorri, Salil S. Kanhere, and Raja Jurdak.
Multi-agent systems: A survey.
IEEE Access,
6:28573–28593, 2018.
[2] Christian Meske, Tobias Hermanns, Esther von der Weiden, Kai-Uwe Loser, and Thorsten Berger.
Vibe coding as a reconfiguration of intent mediation in software development: Definition, implica-
tions, and research agenda. arXiv preprint arXiv:2507.21928, 2025.
[3] OpenAI. Introducing deep research. https://openai.com/index/introducing-deep-research/,
2025.
[4] Khanh-Tung Tran, Dung Dao, Minh-Duong Nguyen, Quoc-Viet Pham, Barry O’Sullivan, and
Hoang D Nguyen.
Multi-agent collaboration mechanisms:
A survey of llms.
arXiv preprint
arXiv:2501.06322, 2025.
[5] Co Tran, Salman Paracha, Adil Hafeez, and Shuguang Chen. Arch-router: Aligning llm routing
with human preferences. arXiv preprint arXiv:2506.16655, 2025.
[6] Zhexin Zhang, Shiyao Cui, Yida Lu, Jingzhuo Zhou, Junxiao Yang, Hongning Wang, and Minlie
Huang. Agent-safetybench: Evaluating the safety of llm agents. arXiv preprint arXiv:2412.14470,
2024.
[7] OpenAI. Introducing gpt-5. https://openai.com/index/introducing-gpt-5/, 2025. Accessed:
2025-11-25.
[8] Wittawat Jitkrittum, Harikrishna Narasimhan, Ankit Singh Rawat, Jeevesh Juneja, Congchao
Wang, Zifeng Wang, Alec Go, Chen-Yu Lee, Pradeep Shenoy, Rina Panigrahy, et al. Universal
model routing for eﬀicient llm inference. arXiv preprint arXiv:2502.08773, 2025.
[9] Tal Shnitzer, Anthony Ou, Mírian Silva, Kate Soule, Yuekai Sun, Justin Solomon, Neil Thompson,
and Mikhail Yurochkin. Large language model routing with benchmark datasets. arXiv preprint
arXiv:2309.15789, 2023.
[10] Jason Wei, Xuezhi Wang, Dale Schuurmans, Maarten Bosma, brian ichter, Fei Xia, Ed Chi, Quoc V
Le, and Denny Zhou. Chain-of-thought prompting elicits reasoning in large language models. In
S. Koyejo, S. Mohamed, A. Agarwal, D. Belgrave, K. Cho, and A. Oh, editors, Advances in Neural
Information Processing Systems, volume 35, pages 24824–24837. Curran Associates, Inc., 2022.
[11] Soyeong Jeong, Aparna Elangovan, Emine Yilmaz, and Oleg Rokhlenko.
Adaptive multi-agent
response refinement in conversational systems. arXiv preprint arXiv:2511.08319, 2025.
[12] Florian Grötschla, Luis Müller, Jan Tönshoff, Mikhail Galkin, and Bryan Perozzi.
Agentsnet:
Coordination and collaborative reasoning in multi-agent llms. arXiv preprint arXiv:2507.08616,
2025.
[13] Yashar Talebirad and Amirhossein Nadiri.
Multi-agent collaboration: Harnessing the power of
intelligent llm agents. arXiv preprint arXiv:2306.03314, 2023.
[14] Stefan Larson, Anish Mahendran, Joseph J Peper, Christopher Clarke, Andrew Lee, Parker Hill,
Jonathan K Kummerfeld, Kevin Leach, Michael A Laurenzano, Lingjia Tang, et al. An evaluation
dataset for intent classification and out-of-scope prediction. arXiv preprint arXiv:1909.02027, 2019.
[15] Xingkun Liu, Arash Eshghi, Pawel Swietojanski, and Verena Rieser. Benchmarking natural language
understanding services for building conversational agents. In Increasing naturalness and flexibility in
spoken dialogue interaction: 10th international workshop on spoken dialogue systems, pages 165–183.
Springer, 2021.
[16] Daniela Gerz, Pei-Hao Su, Razvan Kusztos, Avishek Mondal, Michal Lis, Eshan Singhal, Nikola
Mrksic, Tsung-Hsien Wen, and Ivan Vulic.
Multilingual and cross-lingual intent detection from
spoken data. CoRR, abs/2104.08524, 2021.
[17] Abhinav Rastogi, Xiaoxue Zang, Srinivas Sunkara, Raghav Gupta, and Pranav Khaitan. Schema-
guided dialogue state tracking task at dstc8. arXiv preprint arXiv:2002.01359, 2020.
12
TCAndon-Router
[18] Dujian Ding, Ankur Mallick, Chi Wang, Robert Sim, Subhabrata Mukherjee, Victor Ruhle, Laks VS
Lakshmanan, and Ahmed Hassan Awadallah. Hybrid llm: Cost-eﬀicient and quality-aware query
routing. arXiv preprint arXiv:2404.14618, 2024.
[19] Yu-Neng Chuang, Prathusha Kameswara Sarma, Parikshit Gopalan, John Boccio, Sara Bolouki,
Xia Hu, and Helen Zhou.
Learning to route llms with confidence tokens.
arXiv preprint
arXiv:2410.13284, 2024.
[20] Toby Simonds, Kemal Kurniawan, and Jey Han Lau. Modem: Mixture of domain expert models.
arXiv preprint arXiv:2410.07490, 2024.
[21] Deepak Babu Piskala, Vijay Raajaa, Sachin Mishra, and Bruno Bozza.
Dynamic llm routing
and selection based on user preferences: Balancing performance, cost, and ethics. arXiv preprint
arXiv:2502.16696, 2025.
[22] Justin Chiu and Keiji Shinzato. Cross-encoder data annotation for bi-encoder based product match-
ing. In Proceedings of the 2022 Conference on Empirical Methods in Natural Language Processing:
Industry Track, pages 161–168, 2022.
[23] Zheyuan Zhang, Kaiwen Shi, Zhengqing Yuan, Zehong Wang, Tianyi Ma, Keerthiram Murugesan,
Vincent Galassi, Chuxu Zhang, and Yanfang Ye. Agentrouter: A knowledge-graph-guided llm router
for collaborative multi-agent question answering. arXiv preprint arXiv:2510.05445, 2025.
[24] Tuo Zhang, Asal Mehradfar, Dimitrios Dimitriadis, and Salman Avestimehr. Leveraging uncertainty
estimation for eﬀicient llm routing. arXiv preprint arXiv:2502.11021, 2025.
[25] Qingyun Wu, Gagan Bansal, Jieyu Zhang, Yiran Wu, Beibin Li, Erkang Zhu, Li Jiang, Xiaoyun
Zhang, Shaokun Zhang, Jiale Liu, et al. Autogen: Enabling next-gen llm applications via multi-agent
conversations. In First Conference on Language Modeling, 2024.
[26] Guohao Li, Hasan Abed Al Kader Hammoud, Hani Itani, Dmitrii Khizbullin, and Bernard Ghanem.
Camel: Communicative agents for ”mind” exploration of large language model society. In Thirty-
seventh Conference on Neural Information Processing Systems, 2023.
[27] João Moura and CrewAI contributors. Crewai: A python framework for multi-agent automation.
https://github.com/crewAIInc/crewAI, 2025. Version X.Y.Z (please replace with actual version),
open-source.
[28] Long Ouyang, Jeffrey Wu, Xu Jiang, Diogo Almeida, Carroll Wainwright, Pamela Mishkin, Chong
Zhang, Sandhini Agarwal, Katarina Slama, Alex Ray, et al. Training language models to follow
instructions with human feedback. Advances in neural information processing systems, 35:27730–
27744, 2022.
[29] Hyung Won Chung, Le Hou, Shayne Longpre, Barret Zoph, Yi Tay, William Fedus, Yunxuan Li,
Xuezhi Wang, Mostafa Dehghani, Siddhartha Brahma, et al. Scaling instruction-finetuned language
models. Journal of Machine Learning Research, 25(70):1–53, 2024.
[30] Qiying Yu, Zheng Zhang, Ruofei Zhu, Yufeng Yuan, Xiaochen Zuo, Yu Yue, Weinan Dai, Tiantian
Fan, Gaohong Liu, Lingjun Liu, et al. Dapo: An open-source llm reinforcement learning system at
scale. arXiv preprint arXiv:2503.14476, 2025.
[31] DeepSeek-AI. Deepseek-r1: Incentivizing reasoning capability in llms via reinforcement learning,
2025.
[32] Hongze Tan, Jianfei Pan, Jinghao Lin, Tao Chen, Zhihang Zheng, Zhihao Tang, and Haihua Yang.
Gtpo and grpo-s: Token and sequence-level reward shaping with policy entropy. arXiv preprint
arXiv:2508.04349, 2025.
[33] OpenAI. Gpt-5.1. https://openai.com/index/gpt-5-1/, 2025. Accessed: 2025-01-10.
[34] Anthropic.
Claude sonnet 4.5.
https://www.anthropic.com/news/claude-sonnet-4-5, 2025.
Accessed: 2025-01-10.
[35] DeepSeek-AI. Deepseek-v3 technical report, 2024.
13
TCAndon-Router
[36] Qwen Team. Qwen3 technical report, 2025.
[37] Yuze Zhao, Jintao Huang, Jinghan Hu, Xingjun Wang, Yunlin Mao, Daoze Zhang, Zeyinzi Jiang,
Zhikai Wu, Baole Ai, Ang Wang, Wenmeng Zhou, and Yingda Chen. Swift:a scalable lightweight
infrastructure for fine-tuning, 2024.
[38] Shenzhi Wang, Le Yu, Chang Gao, Chujie Zheng, Shixuan Liu, Rui Lu, Kai Dang, Xionghui Chen,
Jianxin Yang, Zhenru Zhang, et al. Beyond the 80/20 rule: High-entropy minority tokens drive
effective reinforcement learning for llm reasoning. arXiv preprint arXiv:2506.01939, 2025.
[39] Ken Shoemake. Animating rotation with quaternion curves. In Proceedings of the 12th annual
conference on Computer graphics and interactive techniques, pages 245–254, 1985.
[40] mlabonne.
Merge large language models with mergekit.
https://huggingface.co/blog/
mlabonne/merge-models, 2025. Accessed: 2025-12-09.
[41] Christian Walder and Deep Karkhanis. Pass@ k policy optimization: Solving harder reinforcement
learning problems. arXiv preprint arXiv:2505.15201, 2025.
[42] Ganqu Cui, Yuchen Zhang, Jiacheng Chen, Lifan Yuan, Zhi Wang, Yuxin Zuo, Haozhan Li, Yuchen
Fan, Huayu Chen, Weize Chen, et al. The entropy mechanism of reinforcement learning for reasoning
language models. arXiv preprint arXiv:2505.22617, 2025.
14
TCAndon-Router
A
