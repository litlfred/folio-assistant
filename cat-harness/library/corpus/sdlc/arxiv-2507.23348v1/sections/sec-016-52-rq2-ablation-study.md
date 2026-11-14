---
doc_id: arxiv-2507.23348v1
doc_title: "SWE-Debate: Competitive Multi-Agent Debate for Software Issue Resolution"
section_id: sec-016-52-rq2-ablation-study
section_title: "RQ2: Ablation Study"
section_number: 5.2
pages: 7-7
source_pdf: arxiv-2507.23348v1.pdf
source_sha256: 141ba926efb2b113
toc_source: outline
---
To understand the contribution of each component in SWE-Debate,
we conduct comprehensive ablation studies by systematically re-
moving key components and measuring performance degradation
on the SWE-Bench-Verified dataset. Table 2 shows the results of
this analysis, revealing distinct contributions from different archi-
tectural elements.
Table 2: Ablation study results showing the contribution of
different components.
Method
Pass@1
Δ
SWE-Debate
41.4%
-
w/o Multiple Chain Generation
31.4%
-10.0%
w/o Multi-Agent Debate
37.2%
-4.2%
w/o Edit plan
35.4%
-6.0%
We observe that removing the multiple chain generation compo-
nent causes the most significant performance drop, with the method
achieving only 31.4% Pass@1, representing a 10.0 percentage point
degradation. This suggests that exploring diverse fault propagation
paths through graph traversal significantly improves localization
accuracy. When this component is removed, the method must rely
on single-path exploration, which frequently misses critical depen-
dency relationships that span multiple files or modules.
Similarly, removing the edit plan component results in a 6.0
percentage point performance drop, declining from 41.4% to 35.4%.
This demonstrates that the structured modification plans generated
through competitive debate are essential for guiding the down-
stream patch generation process. Without these plans, the MCTS-
based editing agent lacks strategic direction, leading to suboptimal
exploration patterns and reduced fix accuracy.
The multi-agent debate component also plays a critical role. Its
removal leads to a 4.2 percentage point drop, reducing performance
to 37.2%. This highlights the importance of competitive reason-
ing in resolving modification disambiguation. Without structured
debate, the system relies on individual agent exploration, which
often gets stuck in local solutions when multiple plausible fix lo-
cations exist. Our experiments reveal that when the localization
chain contains numerous candidate files, the editing process be-
comes inefficient, with agents spending excessive exploration time
without converging on optimal solutions.
Finding 2: Multiple chain generation provides the largest contri-
bution to performance (+10.0%), followed by edit plan generation
(+6.0%) and Multi-agent debate (+4.2%), demonstrating that each
component addresses distinct limitations in repository-level is-
sue resolution.
5.3
