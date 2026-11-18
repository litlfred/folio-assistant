---
doc_id: arxiv-2402.02172v5
doc_title: "CodeAgent : Autonomous Communicative Agents for Code Review"
section_id: sec-014-related-work
section_title: "Related Work"
section_number: null
pages: 8-8
source_pdf: arxiv-2402.02172v5.pdf
source_sha256: aedb2b60076ad951
toc_source: outline
---
Automating Code Review Activities. Our work
contributes to automating code review activities,
focusing on detecting source code vulnerabilities
Table 5:
Experimental Results for the Code Revi-
sion (CR task) of CodeAgent and the state-of-the-art
works. Bold indicates the best performers.
Approach
Trans-Reviewdata
AutoTransformdata
T5-Reviewdata
Average
EP
EP
EP
EP
Trans-Review
-1.1%
-16.6%
-151.2%
-56.3%
AutoTransform
49.7%
29.9%
9.7%
29.8%
T5-Review
-14.9%
-71.5%
13.8%
-24.2%
CodeBERT
49.8%
-75.3%
22.3%
-1.1%
GraphCodeBERT
50.6%
-80.9%
22.6%
-2.6%
CodeT5
41.8%
-67.8%
25.6%
-0.1%
CodeAgent
42.7%
14.4%
37.6%
31.6%
and maintaining code consistency. Related stud-
ies include Hellendoorn et al. (Hellendoorn et al.,
2021), who addressed code change anticipation,
and Siow et al. (Siow et al., 2020), who intro-
duced CORE for code modification semantics.
Hong et al. (Hong et al., 2022) proposed COM-
MENTFINDER for comment suggestions, while
Tufano et al. (Tufano et al., 2021) and Li et al. (Li
et al., 2022) developed tools for code review au-
tomation using models like T5CR and CodeRe-
viewer, respectively.
Recently, Lu et al. (Lu
et al., 2023) incorporated large language models
for code review, enhancing fine-tuning techniques.
Collaborative AI. Collaborative AI, involving
AI systems working towards shared goals, has
seen advancements in multi-agent LLMs (Talebi-
rad and Nadiri, 2023; Qian et al., 2023), focusing
on collective thinking, conversation dataset cura-
tion (Wei et al., 2023; Li et al., 2023a), and so-
ciological phenomenon exploration (Park et al.,
2023).
Research by Akata et al. (Akata et al.,
2023) and Cai et al. (Cai et al., 2023) further ex-
plores LLM cooperation and efficiency. However,
there remains a gap in integrating these advance-
ments with structured software engineering prac-
tices (Li et al., 2023a; Qian et al., 2023), a chal-
lenge our approach addresses by incorporating ad-
vanced human processes in multi-agent systems.
For a complete overview of related work, please
refer to our Appendix-Section B.
6
