---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-065-timeperformance-tradeoff
section_title: "Time–Performance Tradeoff"
section_number: null
pages: 35-36
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
Figure 15 plots resolution rate against mean agent wall-clock per task—the agent-execution span of
each selected trial (agent runtime only), averaged within each task and then across the 87 tasks—for
both Skills conditions, over the same selection as Table 10. Curated Skills lift the fleet mean by
+16.6 pp at broadly unchanged agent time; the slower half of the fleet runs faster with Skills (e.g.,
OpenHands + Claude Opus 4.7: 10.0 →6.5 minutes per task). Speed and capability are not in tension:
the 4–9-minute band contains both the strongest and the weakest configuration, while the slowest,
OpenHands + Grok 4.3, remains below the with-Skills fleet mean.
35
60m
30m
15m
8m
4m
0%
10%
20%
30%
40%
50%
60%
70%
Resolution Rate (%)
Without Skills
fleet mean  33.9%
GPT-5.5 (Codex)
Gemini 3.1 Pro
(Gemini CLI)
GLM 5.1
Kimi K2.6
Sonnet 4.6
GPT-5.5
Opus 4.7
Gemini 3.1 Pro
Gemini 3.5 Flash
Opus 4.7
(Claude Code)
Opus 4.8
MiniMax M3
DeepSeek V4 Pro
DeepSeek V4 Flash
Grok 4.3
GPT-5.4 Mini
MiniMax M2.7
Gemini 3.1
Flash Lite
60m
30m
15m
8m
4m
With Curated Skills
fleet mean  50.5%
GLM 5.1
Kimi K2.6
GPT-5.5 (Codex)
Opus 4.8
MiniMax M3
Gemini 3.5 Flash
GPT-5.5
Gemini 3.1 Pro
(Gemini CLI)
Opus 4.7
Gemini 3.1 Pro
DeepSeek V4 Pro
DeepSeek V4 Flash
Opus 4.7
(Claude Code)
Sonnet 4.6
Grok 4.3
GPT-5.4 Mini
MiniMax M2.7
Gemini 3.1
Flash Lite
skills lift the fleet mean  33.9%  →  50.5%   (+16.6 pp)
Mean agent wall-clock per task (minutes, log scale)
Figure 15: Resolution rate vs. mean agent wall-clock per task (minutes, log scale), without (left) and
with (right) curated Skills; dashed lines mark fleet means.
M
