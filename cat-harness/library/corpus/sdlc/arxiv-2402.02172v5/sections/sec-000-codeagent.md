---
doc_id: arxiv-2402.02172v5
doc_title: "CodeAgent : Autonomous Communicative Agents for Code Review"
section_id: sec-000-codeagent
section_title: "CodeAgent"
section_number: null
pages: 1-1
source_pdf: arxiv-2402.02172v5.pdf
source_sha256: aedb2b60076ad951
toc_source: outline
---
Xunzhu Tang1, Kisub Kim2, Yewei Song1, Cedric Lothritz3, Bei Li4, Saad Ezzini5,
Haoye Tian6,*, Jacques Klein1, and Tegawendé F. Bissyandé1
1University of Luxembourg
2Singapore Management University
3Luxembourg Institute of Science and Technology
4Northeastern University
5Lancaster University
6The University of Melbourne
Abstract
Code review, which aims at ensuring the over-
all quality and reliability of software, is a cor-
nerstone of software development. Unfortu-
nately, while crucial, Code review is a labor-
intensive process that the research community
is looking to automate.
Existing automated
methods rely on single input-output generative
models and thus generally struggle to emulate
the collaborative nature of code review. This
work introduces CodeAgent, a novel multi-
agent Large Language Model (LLM) system
for code review automation. CodeAgent in-
corporates a supervisory agent, QA-Checker,
to ensure that all the agents’ contributions ad-
dress the initial review question. We evaluated
