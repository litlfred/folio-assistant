---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-012-conclusion
section_title: "Conclusion"
section_number: null
pages: 9-13
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
We introduced SKILLSBENCH, a paired benchmark for evaluating Agent Skills as first-class artifacts.
Across the latest 87-task, 18-configuration no-Skills vs. curated-Skills aggregate, curated Skills
improve performance substantially but unevenly (+16.6 pp on average; range +4.1 pp to +25.7 pp
by configuration). Concise procedural Skills outperform exhaustive documentation, and Skills can
partially substitute for model scale on procedural tasks. We release the benchmark, the BenchFlow
harness, and the public trajectories/results.
Acknowledgments
We thank the organizations whose models we evaluate—OpenAI, Anthropic, Google, Z.ai, Moonshot
AI, DeepSeek, xAI, MiniMax, Alibaba Qwen, Tencent Hunyuan, and Xiaomi MiMo—for model
access and API support. We thank Google Cloud Platform and Amazon Bedrock for cloud and
inference infrastructure support, and the OpenHands team for the open-source harness used in our
main aggregate. We thank Junxian He for guidance and advice; Yi R. (May) Fung for advice and
paper-writing guidance; Gabriel Chua for providing last-minute API keys; Zachary Mueller for
providing GPU resources through Lambda; and Ivan Burazin for providing Daytona credits. We
also thank the following contributors for task and code contributions: Jianheng Hou, Jierun Chen,
Jiahao Liu, Shutong Wu, Yulin Li, Zhenheng Tang, Benny Jiang, Qingyang Ma, Issa Sugiura, Jinya
Jiang, Connor Adams, and Ananth Jayakrishnan Nambiar; and all open-source contributors to the
SKILLSBENCH repositories.
9
References
Anthropic. Introducing the model context protocol. https://www.anthropic.com/news/model
-context-protocol, November 2024.
Anthropic. Equipping agents for the real world with Agent Skills. https://www.anthropic.com/
engineering/equipping-agents-for-the-real-world-with-agent-skills, October
2025a.
Anthropic. Claude Code: an agentic coding tool. https://github.com/anthropics/claude-c
ode, 2025b.
Jacob Austin, Augustus Odena, Maxwell Nye, Maarten Bosma, Henryk Michalewski, David Dohan,
Ellen Jiang, Carrie Cai, Michael Terry, Quoc Le, et al. Program synthesis with large language
models. arXiv preprint arXiv:2108.07732, 2021.
BenchFlow team. BenchFlow: framework for RL environments for LLM agents. https://github
.com/benchflow-ai/benchflow, 2026.
Tom Brown, Benjamin Mann, Nick Ryder, Melanie Subbiah, Jared D Kaplan, Prafulla Dhariwal,
Arvind Neelakantan, Pranav Shyam, Girish Sastry, Amanda Askell, et al. Language models are
few-shot learners. NeurIPS, 2020.
William Brown. Verifiers: Environments for llm reinforcement learning. https://github.com/P
rimeIntellect-ai/verifiers, 2025.
Jun Shern Chan, Neil Chowdhury, Oliver Jaffe, James Aung, Dane Sherburn, Evan Mays, Giulio
Starace, Kevin Liu, Leon Maksin, Tejal Patwardhan, Aleksander Madry, and Lilian Weng. MLE-
bench: Evaluating machine learning agents on machine learning engineering. In ICLR, 2025.
Wei-Lin Chiang, Lianmin Zheng, Ying Sheng, Anastasios Nikolas Angelopoulos, Tianle Li, Dacheng
Li, Banghua Zhu, Hao Zhang, Michael Jordan, Joseph E Gonzalez, et al. Chatbot arena: An open
platform for evaluating llms by human preference. In ICML, 2024.
Google. Gemini CLI: An open-source AI agent that brings the power of Gemini directly into your
terminal. https://github.com/google-gemini/gemini-cli, 2025.
Richard R Hake. Interactive-engagement versus traditional methods: A six-thousand-student survey
of mechanics test data for introductory physics courses. American journal of Physics, 66(1):64–74,
1998. ISSN 0002-9505. doi: 10.1119/1.18809.
Harbor Framework Team. Harbor: A framework for evaluating and optimizing agents and models in
container environments. https://github.com/harbor-framework/harbor, 2026.
Carlos E Jimenez, John Yang, Alexander Wettig, Shunyu Yao, Kexin Pei, Ofir Press, and Karthik R
Narasimhan. SWE-bench: Can language models resolve real-world github issues? In ICLR, 2024.
Omar Khattab, Arnav Singhvi, Paridhi Maheshwari, Zhiyuan Zhang, Keshav Santhanam, Sri Vard-
hamanan, Saiful Haq, Ashutosh Sharma, Thomas T Joshi, Hanna Moazam, et al. Dspy: Compiling
declarative language model calls into self-improving pipelines. arXiv preprint arXiv:2310.03714,
2023.
Jing Yu Koh, Robert Lo, Lawrence Jang, Vikram Duvvur, Ming Lim, Po-Yu Huang, Graham Neubig,
Shuyan Zhou, Russ Salakhutdinov, and Daniel Fried. Visualwebarena: Evaluating multimodal
agents on realistic visual web tasks. In ACL, pages 881–905, 2024.
Hanchung Lee. A Taxonomy of RL Environments for LLM Agents. https://leehanchung.gith
ub.io/blogs/2026/03/21/rl-environments-for-llm-agents/, March 2026.
Patrick Lewis, Ethan Perez, Aleksandra Piktus, Fabio Petroni, Vladimir Karpukhin, Naman Goyal,
Heinrich Küttler, Mike Lewis, Wen-tau Yih, Tim Rocktäschel, et al. Retrieval-augmented genera-
tion for knowledge-intensive nlp tasks. NeurIPS, 2020.
10
Xiao Liu, Hao Yu, Hanchen Zhang, Yifan Xu, Xuanyu Lei, Hanyu Lai, Yu Gu, Hangliang Ding,
Kaiwen Men, Kejuan Yang, et al.
Agentbench: Evaluating llms as agents.
arXiv preprint
arXiv:2308.03688, 2023.
Ryan Lopopolo. Harness engineering: leveraging Codex in an agent-first world. https://openai
.com/index/harness-engineering/, February 2026.
Aman Madaan, Niket Tandon, Prakhar Gupta, Skyler Hallinan, Luyu Gao, Sarah Wiegreffe, Uri
Alon, Nouha Dziri, Shrimai Prabhumoye, Yiming Yang, et al. Self-refine: Iterative refinement
with self-feedback. NeurIPS, 2023.
Peter Mattson, Christine Cheng, Gregory Diamos, Cody Coleman, Paulius Micikevicius, David
Patterson, Hanlin Tang, Gu-Yeon Wei, Peter Bailis, Victor Bittorf, et al. Mlperf training benchmark.
MLSys, 2020.
Mike A Merrill, Alexander G Shaw, Nicholas Carlini, Boxuan Li, Harsh Raj, Ivan Bercovich, Lin
Shi, Jeong Yeon Shin, Thomas Walshe, E Kelly Buchanan, et al. Terminal-bench: Benchmarking
agents on hard, realistic tasks in command line interfaces. arXiv preprint arXiv:2601.11868, 2026.
OpenAI. Codex CLI: Lightweight coding agent that runs in your terminal. https://github.com
/openai/codex, 2025.
Long Ouyang, Jeffrey Wu, Xu Jiang, Diogo Almeida, Carroll Wainwright, Pamela Mishkin, Chong
Zhang, Sandhini Agarwal, Katarina Slama, Alex Ray, et al. Training language models to follow
instructions with human feedback. NeurIPS, 2022.
Yujia Qin, Shihao Liang, Yining Ye, Kunlun Zhu, Lan Yan, Yaxi Lu, Yankai Lin, Xin Cong, Xiangru
Tang, Bill Qian, Sihan Zhao, Lauren Hong, Runchu Tian, Ruobing Xie, Jie Zhou, Mark Gerstein,
dahai li, Zhiyuan Liu, and Maosong Sun. ToolLLM: Facilitating Large Language Models to Master
16000+ Real-world APIs. In ICLR, 2024.
Timo Schick, Jane Dwivedi-Yu, Roberto Dessì, Roberta Raileanu, Maria Lomeli, Eric Hambro, Luke
Zettlemoyer, Nicola Cancedda, and Thomas Scialom. Toolformer: Language models can teach
themselves to use tools. NeurIPS, 2023.
Noah Shinn, Federico Cassano, Ashwin Gopinath, Karthik Narasimhan, and Shunyu Yao. Reflexion:
Language agents with verbal reinforcement learning. NeurIPS, 2023.
Aarohi Srivastava, Abhinav Rastogi, Abhishek Rao, Abu Awal Md Shoeb, Abubakar Abid, Adam
Fisch, Adam R Brown, Adam Santoro, Aditya Gupta, Adrià Garriga-Alonso, et al. Beyond the
imitation game: Quantifying and extrapolating the capabilities of language models. TMLR, 2023.
Theodore Sumers, Shunyu Yao, Karthik R Narasimhan, and Thomas L Griffiths. Cognitive architec-
tures for language agents. TMLR, 2024.
Richard S Sutton, Doina Precup, and Satinder Singh. Between MDPs and semi-MDPs: A framework
for temporal abstraction in reinforcement learning. Artificial intelligence, 1999.
Harsh Trivedi, Tushar Khot, Mareike Hartmann, Ruskin Manku, Vinty Dong, Edward Li, Shashank
Gupta, Ashish Sabharwal, and Niranjan Balasubramanian. AppWorld: A Controllable World of
Apps and People for Benchmarking Interactive Coding Agents. In ACL, 2024.
Guanzhi Wang, Yuqi Xie, Yunfan Jiang, Ajay Mandlekar, Chaowei Xiao, Yuke Zhu, Linxi Fan, and
Anima Anandkumar. Voyager: An Open-Ended Embodied Agent with Large Language Models.
arXiv preprint arXiv:2305.16291, 2023a.
Zhiruo Wang, Shuyan Zhou, Daniel Fried, and Graham Neubig. Execution-based evaluation for
open-domain code generation. In Findings of EMNLP 2023, 2023b.
Jason Wei, Xuezhi Wang, Dale Schuurmans, Maarten Bosma, Brian Ichter, Fei Xia, Ed Chi, Quoc V
Le, Denny Zhou, et al. Chain-of-thought prompting elicits reasoning in large language models.
NeurIPS, 2022.
11
Tianbao Xie, Danyang Zhang, Jixuan Chen, Xiaochuan Li, Siheng Zhao, Ruisheng Cao, Toh Jing
Hua, Zhoujun Cheng, Dongchan Shin, Fangyu Lei, et al. Osworld: Benchmarking multimodal
agents for open-ended tasks in real computer environments. NeurIPS, 2024.
John Yang, Akshara Prabhakar, Karthik Narasimhan, and Shunyu Yao. Intercode: Standardizing and
benchmarking interactive coding with execution feedback. NeurIPS, 2023.
John Yang, Carlos E Jimenez, Alexander Wettig, Kilian Lieret, Shunyu Yao, Karthik Narasimhan,
and Ofir Press. Swe-agent: Agent-computer interfaces enable automated software engineering.
NeurIPS, 2024.
John Yang, Kilian Lieret, Carlos E. Jimenez, Alexander Wettig, Kabir Khandpur, Yanzhe Zhang,
Binyuan Hui, Ofir Press, Ludwig Schmidt, and Diyi Yang. Swe-smith: Scaling data for software
engineering agents. In NeurIPS, 2025.
Shunyu Yao, Dian Yu, Jeffrey Zhao, Izhak Shafran, Tom Griffiths, Yuan Cao, and Karthik Narasimhan.
Tree of thoughts: Deliberate problem solving with large language models. NeurIPS, 2023a.
Shunyu Yao, Jeffrey Zhao, Dian Yu, Nan Du, Izhak Shafran, Karthik R Narasimhan, and Yuan Cao.
React: Synergizing reasoning and acting in language models. In ICLR, 2023b.
Shunyu Yao, Noah Shinn, Pedram Razavi, and Karthik R Narasimhan. τ-bench: A Benchmark for
Tool-Agent-User Interaction in Real-World Domains. In ICLR, 2025.
Christine Ye, Sihan Yuan, Suchetha Cooray, Steven Dillmann, Ian LV Roque, Dalya Baron, Philipp
Frank, Sergio Martin-Alvarez, Nolan Koblischke, Frank J Qu, et al. ReplicationBench: Can AI
Agents Replicate Astrophysics Research Papers? arXiv preprint arXiv:2510.24591, 2025.
Andy K Zhang, Neil Perry, Riya Dulepet, Joey Ji, Celeste Menders, Justin W Lin, Eliot Jones, Gashon
Hussein, Samantha Liu, Donovan Jasper, et al. Cybench: A framework for evaluating cybersecurity
capabilities and risks of language models. arXiv preprint arXiv:2408.08926, 2024.
Andy Zhou, Kai Yan, Michal Shlapentokh-Rothman, Haohan Wang, and Yu-Xiong Wang. Language
Agent Tree Search Unifies Reasoning Acting and Planning in Language Models. In ICML, 2024a.
Denny Zhou, Nathanael Schärli, Le Hou, Jason Wei, Nathan Scales, Xuezhi Wang, Dale Schuurmans,
Claire Cui, Olivier Bousquet, Quoc Le, and Ed Chi. Least-to-Most Prompting Enables Complex
Reasoning in Large Language Models. In ICLR, 2023a.
Shuyan Zhou, Uri Alon, Frank F Xu, Zhengbao Jiang, and Graham Neubig. Docprompting: Generat-
ing code by retrieving the docs. In ICLR, 2023b.
Shuyan Zhou, Frank F. Xu, Hao Zhu, Xuhui Zhou, Robert Lo, Abishek Sridhar, Xianyi Cheng,
Tianyue Ou, Yonatan Bisk, Daniel Fried, Uri Alon, and Graham Neubig. WebArena: A Realistic
Web Environment for Building Autonomous Agents. In ICLR, 2024b.
Terry Yue Zhuo, Vu Minh Chien, Jenny Chim, Han Hu, Wenhao Yu, Ratnadira Widyasari, Imam
Nur Bani Yusuf, Haolan Zhan, Junda He, Indraneil Paul, Simon Brunner, Chen GONG, James
Hoang, Armel Randy Zebaze, Xiaoheng Hong, Wen-Ding Li, Jean Kaddour, Ming Xu, Zhihan
Zhang, Prateek Yadav, Naman Jain, Alex Gu, Zhoujun Cheng, Jiawei Liu, Qian Liu, Zijian Wang,
David Lo, Binyuan Hui, Niklas Muennighoff, Daniel Fried, Xiaoning Du, Harm de Vries, and
Leandro Von Werra. BigCodeBench: Benchmarking Code Generation with Diverse Function Calls
and Complex Instructions. In ICLR, 2025.
12
A
