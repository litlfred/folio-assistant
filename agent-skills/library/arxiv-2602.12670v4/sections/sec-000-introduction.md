---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-000-introduction
section_title: "Introduction"
section_number: null
pages: 2-2
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
AI agents are now deployed in production workflows, from software engineering [Anthropic, 2025b,
Google, 2025, OpenAI, 2025], where they sustain task horizons of up to 10 hours of human effort,
to expertise-heavy domains beyond it. A fundamental tension follows: foundation models provide
broad capabilities but lack the procedural knowledge a specialist brings on day one, while fine-tuning
each domain is expensive and sacrifices generality [Brown et al., 2020, Ouyang et al., 2022, Yao
et al., 2023b].
Agent Skills [Anthropic, 2025a] are an emerging solution: structured packages of instructions, code
templates, resources, and reference material that augment agents at inference time without modifying
model weights. Skills encode standard operating procedures, domain conventions, and task heuristics
as modular artifacts mediated by the agent harness [Sutton et al., 1999, Sumers et al., 2024].
Community Skills ecosystems have already grown to 2,014,000 source-partitioned Skills in our con-
struction snapshot (Figure 2; Appendix A). Yet despite this proliferation, no benchmark systematically
asks: how much do Skills actually help, and when do they fail? Existing agent benchmarks [Liu
et al., 2023, Merrill et al., 2026, Jimenez et al., 2024, Zhou et al., 2024b, Xie et al., 2024, Koh
et al., 2024, Trivedi et al., 2024, Yang et al., 2023, Chan et al., 2025, Zhuo et al., 2025] measure raw
capability in isolation, asking how well a model performs task X while folding model, harness, and
augmentation effects into one pass rate. They do not answer the deployment question: will adding
this Skill help my agent on this task, and by how much? Figure 1 illustrates the layered architecture
and previews our main result: curated Skills improve resolution rates across 18 model–harness
configurations by +16.6 pp on average.
