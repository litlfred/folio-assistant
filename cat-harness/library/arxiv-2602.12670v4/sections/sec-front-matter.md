---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-front-matter
section_title: "Front matter"
section_number: null
pages: 1-2
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
SkillsBench: Benchmarking How Well Agent Skills
Work Across Diverse Tasks
Xiangyi Li1,*, Yimin Liu1,2,*, Wenbo Chen3,*,†, Bingran You1,4,*, Zonglin Di5,‡,
Yifeng He6,‡, Shenghan Zheng7,‡, Kyoung Whan Choe8,‡, Jiankai Sun9,‡, Shuyi Wang9,‡,
Chujun Tao14,‡, Binxu Li10,‡, Xuandong Zhao4,‡, Hejia Geng11, Xiaojun Wu35, Junwei Zhou9,
Xiaokun Chen12, Hanwen Xing13, Yubo Li14, Qunhong Zeng9, Di Wang15, Yuanli Wang16,
Roey Ben Chaim17, Penghao Jiang18, Haotian Shen9, Luyang Kong9, Xinyi Liu9,
Runhui Wang9, Xuanqing Liu9, Jiachen Li19, Xin Lan20, Yueqian Lin21, Wengao Ye11,
Junwei He22, Songlin Li12, Yue Zhang23, Yipeng Gao13, Yijiang Li24, Ze Ma25, Liqiang Jing23,
Tianyu Wang9, Kaixin Li9, Yiqi Xue13, Haoran Lyu9, Yizhuo He14, Yuchen Tian9,
Shutong Wu26, Bowei Wang9, Yixuan Gao27, Bo Chen9, Litong Liu28, Sikai Cheng28,
Jiajun Bao14, Shuaicheng Tong28, Shuwen Xu9, Terry Yue Zhuo9, Tinghan Ye28, Qi Qi9,
Miao Li28, Longtai Liao9, Zelin Tan34, Chang Shi19, Xilin Tang29, Srinath Tankasala3,†,
Boqin Yuan24, Yaoyao Qian30, Jianhong Tu5, Chenguang Wang5, Yizhou Sun31,
Wei Wang31, Aaron Taylor33, Ziyue Yang6, Changkun Guan28, Zhikang Dong32,
Xinyu Zhang36, Steven Dillmann12, Han-chung Lee9, Dawn Song4
Abstract
Agent Skills are structured packages of procedural knowledge that augment large
language model (LLM) agents at inference time. Despite rapid adoption, there is no
standard way to measure whether they actually help. We present SKILLSBENCH,
a benchmark whose current inventory contains 87 tasks across 8 domains paired
with curated Skills and deterministic verifiers. Our latest aggregate evaluation
runs the 87-task benchmark under matched no-Skills and curated-Skills conditions
for 18 model–harness configurations. Curated Skills raise the average pass rate
from 33.9% to 50.5% (+16.6 percentage points; 25.5% normalized gain), with
configuration-level gains ranging from +4.1 to +25.7 pp. Focused Skills with at
most three modules outperform larger or exhaustive bundles, and smaller models
with Skills can match larger models without them. SKILLSBENCH establishes
paired evaluation as the foundation for rigorous measurement of Skill efficacy on
agentic, expertise-heavy work.
Skills
applications
Agent Harness
Operating Systems
Models
CPUs
Gemini 3.1
Flash Lite
(OH)
MiniMax
M2.7
(OH)
GPT-5.4
Mini
(OH)
Grok 4.3
(OH)
DeepSeek
V4 Flash
(OH)
Claude
Sonnet 4.6
(OH)
Gemini 3.5
Flash
(OH)
DeepSeek
V4 Pro
(OH)
Gemini 3.1
Pro
(OH)
MiniMax
M3
(OH)
Claude
Opus 4.7
(OH)
Kimi K2.6
(OH)
Claude
Opus 4.8
(OH)
GLM 5.1
(OH)
Gemini 3.1
Pro
(GCLI)
Claude
Opus 4.7
(CC)
GPT-5.5
(Codex)
GPT-5.5
(OH)
0.0
0.1
0.2
0.3
0.4
0.5
0.6
0.7
Resolution Rate
No Skills
Skill Lift
OpenAI
Anthropic
Google
DeepSeek
Moonshot
Zhipu
MiniMax
xAI
Skills
applications
Agent Harness
Operating Systems
Models
CPUs
Figure 1: Agent architecture stack and resolution rates across 18 model–harness configurations on 87 SkillsBench
tasks. Each bar stacks the no-Skills baseline and curated-Skills lift; open/filled interval markers denote 95%
CIs for the baseline/total. Bars are ordered by Curated-Skills pass rate and colored by model family. Harness
abbreviations: OH = OpenHands, CC = Claude Code, GCLI = Gemini CLI.
1BenchFlow, 2OSU, 3Amazon, 4UC Berkeley, 5UC Santa Cruz, 6UC Davis, 7Dartmouth, 8RLWRLD, 9Independent, 10Princeton University,
11Oxford University, 12Stanford University, 13USC, 14CMU, 15Foxconn, 16BU, 17Zenity, 18UNSW, 19UT Austin, 20MSU, 21Duke University,
22ByteDance, 23UT Dallas, 24UC San Diego, 25Columbia University, 26University of Rochester, 27Cornell Tech, 28Georgia Tech, 29Cornell
University, 30NEU, 31UCLA, 32Snap Inc., 33Fanshawe College, 34University of Science and Technology of China, 35HKUST(GZ), 36Anyscale
*Equal contribution. ‡Core contribution. †This work was conducted outside the author’s role at Amazon. Correspondence: Xiangyi Li at
xiangyi@benchflow.ai.
arXiv:2602.12670v4  [cs.AI]  14 Jun 2026
1
