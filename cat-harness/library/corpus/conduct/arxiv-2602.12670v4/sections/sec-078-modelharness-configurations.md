---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-078-modelharness-configurations
section_title: "Model–Harness Configurations"
section_number: null
pages: 42-42
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
We evaluate four terminal-agent harnesses in the latest aggregate: OpenHands, Claude Code [An-
thropic, 2025b], Codex CLI [OpenAI, 2025], and Gemini CLI [Google, 2025]. Each model is
evaluated with the harness shown in Appendix Table 5. All models use temperature 0. The full model
identifiers, harness versions, and selected result counts are listed in Appendix Table 5.
These commercial harnesses tightly couple model behavior, context construction, tool interfaces,
and execution control. We therefore report results at the model–harness level rather than treating
models as isolated components. Claude models have been trained with awareness of the Agent Skills
specification [Anthropic, 2025a], which may affect how they interpret Skill-formatted instructions.
N.2
