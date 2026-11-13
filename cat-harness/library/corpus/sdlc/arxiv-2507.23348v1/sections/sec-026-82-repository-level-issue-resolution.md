---
doc_id: arxiv-2507.23348v1
doc_title: "SWE-Debate: Competitive Multi-Agent Debate for Software Issue Resolution"
section_id: sec-026-82-repository-level-issue-resolution
section_title: "Repository-Level Issue Resolution"
section_number: 8.2
pages: 10-10
source_pdf: arxiv-2507.23348v1.pdf
source_sha256: 141ba926efb2b113
toc_source: outline
---
prehensive test suites to trigger fault patterns [25, 37], struggle with
complex dependency relationships across multiple files, and cannot
effectively bridge the semantic gap between natural language issue
descriptions and code structures.
Recent LLM-based approaches have advanced fault localization
through sophisticated code understanding and repository naviga-
tion capabilities. Methods like RCAgent [40] integrate multiple
analysis tools for decision support, and AgentFL [32] scales fault
localization through multi-agent collaboration with static analysis
tools [32, 40, 42, 44]. LocAgent [6] leverages graph-based repre-
sentations to enable multi-hop reasoning across code dependen-
cies, while OrcaLoca [48] improves localization accuracy through
priority-based scheduling and distance-aware context pruning. And
CoSIL [14] reduces search space using module call graphs with
iterative context-aware exploration. However, these methods re-
main fundamentally limited by single-agent reasoning perspectives
and struggle with modification disambiguation scenarios where
multiple locations match issue descriptions but require different
architectural viewpoints for correct evaluation. Our work addresses
this limitation by introducing competitive multi-agent debate that
systematically evaluates competing localization hypotheses.
8.2
Repository-Level Issue Resolution
Automated repository issue resolution has evolved through two
main paradigms-agent-based and pipeline-based. Agent-based sys-
tems model software engineering as sequential decision-making,
where language models interact with code environments through
structured action spaces. SWE-Agent [46] established foundational
principles for agent-environment interaction, AutoCodeRover [52]
focused on search-based localization, SWE-Search [1] introduced
Monte Carlo Tree Search for systematic exploration, and CodeR [3]
explored collaborative multi-agent architectures with pre-defined
task graphs. Pipeline-based approaches break down issue reso-
lution into specialized computational workflows. Agentless [43]
pioneered this paradigm by separating localization, repair, and vali-
dation into targeted stages, while CodeMonkeys [10] investigated
iterative refinement through test-time computation scaling. Recent
advances include long-context models with appropriate prompt-
ing [13], training-based approaches for specialized model fine-
tuning [27, 29, 47], and RepoUnderstander [23] which constructs
repository knowledge graphs for enhanced whole-repository un-
derstanding.
However, existing methodologies face a fundamental limitation
stemming from limited observation scope. They often get stuck
in local solutions and fail to resolve ambiguities when multiple
code locations appear plausible, as they lack the diverse analytical
perspectives needed to systematically evaluate competing mod-
ification plans [1, 7, 51]. Our approach targets this localization
bottleneck by providing more accurate fault localization through
competitive multi-agent analysis, enabling seamless integration
with current issue resolution systems while improving their overall
issue resolution rates.
8.3
