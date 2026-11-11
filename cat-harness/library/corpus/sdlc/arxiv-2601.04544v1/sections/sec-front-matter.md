---
doc_id: arxiv-2601.04544v1
doc_title: "TCAndon-Router: Adaptive Reasoning Router for Multi-Agent Collaboration"
section_id: sec-front-matter
section_title: "Front matter"
section_number: null
pages: 1-1
source_pdf: arxiv-2601.04544v1.pdf
source_sha256: 5472dcd690fe1c89
toc_source: outline
---
TCAndon-Router
TCAndon-Router: Adaptive Reasoning Router for
Multi-Agent Collaboration
Jiuzhou Zhao∗, Chunrong Chen∗, Chenqi Qiao∗, Lebin Zheng∗,
Minqi Han∗, Yanchi Liu∗Yongzhou Xu∗Xiaochuan Xu∗Min Zhang∗
∗Tencent Cloud Andon
{joskazhao, charentchen, chenqiqiao, lebinzheng}@tencent.com
{minqihan, yanncyliu, alanxu, xxcxu, alexzmzhang}@tencent.com
Abstract
Multi-Agent Systems(MAS) have become a powerful paradigm for building high performance intelli-
gent applications. Within these systems, the router responsible for determining which expert agents
should handle a given query plays a crucial role in overall performance. Existing routing strategies
generally fall into two categories: performance routing, which balances latency and cost across mod-
els of different sizes, and task routing, which assigns queries to domain-specific experts to improve
accuracy. In real-world enterprise applications, task routing is more suitable; however, most existing
approaches rely on static single-label decisions, which introduce two major limitations: (i) diﬀiculty
in seamlessly integrating new agents as business domains expand, and (ii) routing conflicts caused
by overlapping agent capabilities, ultimately degrading accuracy and robustness.To address these
challenges, we propose TCAndon-Router(TCAR): an adaptive reasoning router for multi-agent col-
laboration. Unlike traditional routers, TCAR supports dynamic agent onboarding and first generates
a natural-language reasoning chain before predicting a set of candidate agents capable of handling
the query. In addition, we design a collaborative execution pipeline in which selected agents indepen-
dently produce responses, which are then aggregated and refined into a single high-quality response by
a dedicated Refining Agent.Experiments on public datasets and real enterprise data demonstrate that
TCAR significantly improves routing accuracy, reduces routing conflicts, and remains robust in am-
biguous scenarios. We have released TCAR at https://huggingface.co/tencent/TCAndon-Router
to support future research on explainable and collaborative multi-agent routing.
1
