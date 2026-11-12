---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-035-setup-overview
section_title: "Setup overview"
section_number: null
pages: 20-20
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
We instantiate the SKILLSBENCH protocol across commercial terminal agents and model–harness
configurations. The latest aggregate targets a fixed 9,396-slot frame (18 configurations × 87 tasks
× 2 conditions × 3 trials), with 9,396 selected public result files currently available. All runs use
temperature 0; unscored, stale, or rate-limited rows are tracked as coverage gaps for audit and rerun,
while timeout rows are used only when healthy pass/fail replacements are unavailable and are scored
as failures.
Models.
The latest aggregate pairs OpenHands with GPT-5.5, GPT-5.4 Mini, Claude Opus 4.8/4.7,
Claude Sonnet 4.6, Gemini 3.1 Pro, Gemini 3.5 Flash, Gemini 3.1 Flash Lite, GLM 5.1, Kimi K2.6,
DeepSeek V4 Pro/Flash, Grok 4.3, and MiniMax M3/M2.7; Gemini CLI with Gemini 3.1 Pro; Claude
Code with Claude Opus 4.7; and Codex CLI with GPT-5.5. Full identifiers and selected result counts
are listed in Table 5; protocol-level details appear in Appendix N.
Metrics.
Our primary metric is task-macro pass rate following Terminal-Bench [Merrill et al.,
2026]: verifier-scored pass/fail outcomes are averaged over repeated trials within each task and
then averaged across the fixed inventory of 87 tasks. We report absolute Skills improvement and
normalized gain g = (passskill −passvanilla)/(1 −passvanilla) as defined in the main text (§4). We
interpret g alongside absolute pass-rate deltas to avoid ceiling-effect artifacts. Harness versions,
resource limits, retry rules, and confidence-interval calculations are provided in Appendix N.
D.2
