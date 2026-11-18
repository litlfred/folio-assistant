---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-010-limitations-and-future-work
section_title: "Limitations and Future Work"
section_number: null
pages: 8-8
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
Coverage and generalization. SKILLSBENCH focuses on terminal-based, containerized tasks for
reproducible evaluation, so results may not transfer directly to GUI agents, multi-agent coordination,
or very long-horizon workflows. We also evaluate a limited set of models and harnesses whose
Skills integration can change over time. A natural extension is multi-modal Skills and protocols
for vision-language agents in GUI environments.
Causal attribution and controls. Skills injection increases context length, so observed gains
could partly reflect “more context” rather than procedural structure. Our self-generated Skills
condition suggests that model-authored procedural text does not reproduce the curated-Skills gain
(Appendix D.6), though its deficit mixes content quality with skill-discovery and creator/solver
interference effects. Future work requires stronger length-matched baselines, such as random or
irrelevant text and retrieval-only documentation, to isolate which components (steps, examples, code
resources) drive improvement and to study automatic Skills synthesis.
Determinism, contamination, and ecological validity. Containerization provides state isolation but
not perfect determinism or immunity to training-set leakage. We mitigate with multiple runs, a leak-
age audit (§3), and paired (Skills vs. no Skills) comparisons, yet cannot eliminate all nondeterminism
or memorization effects. Future work should evaluate ecosystem-representative settings, including
lower-quality and automatically selected Skills, and study Skills composition: when multiple Skills
help or interfere, and whether composite performance can be predicted from atomic effects.
7
