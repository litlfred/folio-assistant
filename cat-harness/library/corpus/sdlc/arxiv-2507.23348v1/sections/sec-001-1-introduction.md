---
doc_id: arxiv-2507.23348v1
doc_title: "SWE-Debate: Competitive Multi-Agent Debate for Software Issue Resolution"
section_id: sec-001-1-introduction
section_title: "Introduction"
section_number: 1
pages: 1-2
source_pdf: arxiv-2507.23348v1.pdf
source_sha256: 141ba926efb2b113
toc_source: outline
---
Automated repository-level issue resolution has emerged as a criti-
cal challenge in software engineering. The task aims to automat-
ically localize and fix the defective code snippets, based on re-
ported issues. In software development, developers spend a major-
ity of their debugging efforts in understanding code and making
changes [15, 52]. Meanwhile, automated tools often struggle with
the same challenge [4, 33, 39]. Inadequate code understanding leads
†Equal contribution.
‡Xiaodong Gu is the corresponding author.
1Our code and data are available at https://github.com/YerbaPage/SWE-Debate
to incomplete fixes, introduces new bugs, and significantly extends
development cycles [5, 7].
The key challenge in effective issue resolution is fault localiza-
tion, namely, identifying the code snippets triggering the specific
issue [43]. Unlike conventional code retrieval, fault localization re-
quires a deeper connection between natural language issue descrip-
tions and programming language structures. This process requires
reasoning over the structural and semantic properties of code, of-
ten across complex dependency graphs [6, 14, 18], and entails a
comprehensive understanding of software architecture as well as
strategic decision-making.
The emergence of LLMs has significantly advanced this area
by leveraging code understanding and reasoning capabilities [35,
42, 44]. More recently, agent-based methods [1, 3, 38, 46, 52] have
emerged, simulating autonomous agents capable of tool use and
high-level decision-making. These approaches use iterative explo-
ration and planning to enable systematic codebase traversal, repre-
senting a shift toward structured and interactive issue resolution
processes [22, 43].
While agent-based approaches have shown notable progress on
standard benchmarks such as SWE-bench [15], they mainly rely
on agents’ independent exploration, that is, the agents individually
understand code repository and propose their modification plans.
As a result, they often get stuck in local solutions and fail to identify
issue patterns that span across large, complex codebases [5, 7]. This
fundamental limitation stems from a core challenge we term limited
observation scope [32, 48]: when multiple code locations appear rel-
evant to the issue description, correct resolution often depends on a
deep understanding of code structure and component relationships.
However, independent exploring agents lack the diverse analyti-
cal perspectives needed to systematically compare and rank these
competing alternatives. This limitation becomes more pronounced
when agents are faced with multiple plausible fix strategies or mod-
ification points, each with different implications for maintainability,
compatibility, and architectural soundness [6, 14, 18, 52]. Without
sufficient reasoning capacity to evaluate these trade-offs holisti-
cally, independent exploring agents often fail to directly identify
arXiv:2507.23348v1  [cs.SE]  31 Jul 2025
Conference’17, July 2017, Washington, DC, USA
Li et al.
the correct fix location and strategy, relying instead on repeated
trial-and-error that is both inefficient and error-prone [1, 10].
To address these challenges, we propose SWE-Debate, a com-
petitive multi-agent debate framework that promotes diverse rea-
soning paths and achieves more consolidated fault localization.
SWE-Debate reframes issue resolution through graph-guided local-
ization and structured debate mechanisms. The framework operates
through a three-stage pipeline. First, it creates multiple fault prop-
agation traces as localization proposals by dependency analysis
across the codebase. Specifically, a static dependency graph is built
to represent relationships among code entities—such as function
calls, class inheritance, module imports, and variable references.
Using language model-based semantic matching, SWE-Debate iden-
tifies entities that are most relevant to the issue description, which
serve as high-confidence entry points for chain construction. SWE-
Debate traverses the graph from each entry point, yielding a set of
candidate localization chains. Each chain captures a potential fault
propagation path, reflecting different structural viewpoints, i.e., al-
ternative code organization contexts in which the issue may appear,
such as along a call hierarchy, inheritance structure, or shared data
flow. Next, the algorithm creates a consensus fix plan through a
structured three-round debate process. In the first round, multiple
agents engage in competitive ranking to select the most promising
fault propagation trace. Based on the selected trace, agents inde-
pendently propose candidate modification plans based on different
reasoning perspectives, then engage in competitive refinement to
defend their proposals while critiquing alternatives. A discrimina-
tor selects the most promising plan, synthesizing insights from the
debate to produce a coherent and actionable modification plan. In
the final stage, the modification plan is used to initialize a Monte
Carlo Tree Search (MCTS) framework [1] for patch generation.
Our experimental evaluation on the SWE-Bench-Verified dataset
systematically compares SWE-Debate against state-of-the-art base-
lines. SWE-Debate achieves new state-of-the-art results under open-
source agent frameworks and outperforms baseline methods by a
large margin. Ablation studies show that the multiple chain gen-
eration mechanism provides the largest contribution to overall
performance, validating our hypothesis that the fault propagation
traces proposal enables more accurate fault localization and issue
resolution.
Our main contributions include:
• A novel method to generate multiple candidate fault propaga-
tion traces. The method captures diverse potential fault prop-
agation paths through code dependencies and structural rela-
tionships.
• A competitive multi-agent debate framework for precise fault
localization through diverse reasoning perspectives and struc-
tured argumentation.
• Extensive experiments show that our competitive debate paradigms
achieve 6.7% improvement in issue resolution rate and 5.1% im-
provement in fault localization accuracy.
2
