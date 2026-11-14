---
doc_id: arxiv-2507.23348v1
doc_title: "SWE-Debate: Competitive Multi-Agent Debate for Software Issue Resolution"
section_id: sec-027-83-llm-multi-agent-systems
section_title: "LLM Multi-Agent Systems"
section_number: 8.3
pages: 10-11
source_pdf: arxiv-2507.23348v1.pdf
source_sha256: 141ba926efb2b113
toc_source: outline
---
Multi-agent systems have emerged as a promising approach for
complex problem-solving by leveraging diverse specialized per-
spectives and collaborative reasoning. In software engineering
contexts, these systems have shown success across various tasks
including code generation [12, 41], automated testing and debug-
ging [11, 34]. Current multi-agent architectures mainly use col-
laborative paradigms that emphasize consensus-building and in-
formation sharing, with scaling achieved through either cognitive
enhancement of individual agents or population scaling through
large agent collectives [30, 53].
SWE-Debate: Competitive Multi-Agent Debate for Software Issue Resolution
Conference’17, July 2017, Washington, DC, USA
Multi-agent debate systems represent a particularly relevant
approach for decision-making scenarios requiring systematic eval-
uation of competing alternatives. Existing debate frameworks typ-
ically follow collaborative models where agents engage in struc-
tured argumentation to reach consensus through iterative refine-
ment [2, 9]. However, these collaborative approaches face crit-
ical limitations in technical domains: agents often suffer from
thought degeneration and resist modification despite potentially
incorrect stances. Recent work has attempted to address these is-
sues through role assignment strategies and agreement modulation
techniques [19, 50], but these approaches still maintain collabora-
tive consensus-seeking paradigms that may not generate sufficient
analytical pressure for complex architectural decision-making. In
contrast, our work introduces a competitive debate framework for
software fault localization that creates analytical tension by forcing
agents to rigorously defend their localization hypotheses against
competing proposals. Our structured, multi-round debate, com-
bined with graph-based dependency analysis, is designed to excel
at tasks requiring precise disambiguation and strategic architec-
tural reasoning, overcoming the limitations of purely collaborative
systems.
9
