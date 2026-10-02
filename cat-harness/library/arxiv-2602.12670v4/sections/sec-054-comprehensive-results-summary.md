---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-054-comprehensive-results-summary
section_title: "Comprehensive Results Summary"
section_number: null
pages: 29-30
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
Table 10 consolidates the latest aggregate results across 18 model–harness configurations and two
matched Skills conditions. Scores are computed on the fixed 87 × 3 trial frame per condition,
consistent with the task-macro scoring used in the main text; the n column reports current public
coverage.
Table 10: Comprehensive latest results across model–harness configurations. Pass rates use a fixed
87×3 denominator per condition; ∆is curated-Skills improvement and g is normalized gain. Models
are ordered by with-Skills pass rate; n reports selected no-Skills / curated-Skills result files.
Harness
Model
No Sk.
With Sk.
∆(pp)
g (%)
n
OpenHands
GPT-5.5
51.5
67.3
+15.8
32.6
261/261
Codex
GPT-5.5
46.8
66.5
+19.7
37.0
261/261
Claude Code
Opus 4.7
43.0
61.2
+18.2
31.9
261/261
Gemini CLI
Gemini 3.1 Pro
36.0
60.8
+24.8
38.7
261/261
OpenHands
GLM 5.1
32.7
58.4
+25.7
38.1
261/261
OpenHands
Claude Opus 4.8
45.7
54.1
+8.4
15.5
261/261
OpenHands
Kimi K2.6
33.4
54.0
+20.6
31.0
261/261
OpenHands
Claude Opus 4.7
42.1
53.1
+11.1
19.1
261/261
OpenHands
MiniMax M3
29.7
53.0
+23.3
33.2
261/261
OpenHands
Gemini 3.1 Pro
33.8
52.8
+19.0
28.7
261/261
OpenHands
DeepSeek V4 Pro
26.9
50.1
+23.2
31.8
261/261
OpenHands
Gemini 3.5 Flash
41.1
48.2
+7.1
12.1
261/261
OpenHands
Claude Sonnet 4.6
33.5
47.2
+13.6
20.5
261/261
OpenHands
DeepSeek V4 Flash
27.5
44.7
+17.2
23.7
261/261
OpenHands
Grok 4.3
22.8
41.7
+18.8
24.4
261/261
OpenHands
GPT-5.4 Mini
29.9
41.4
+11.5
16.4
261/261
OpenHands
MiniMax M2.7
18.1
34.9
+16.8
20.5
261/261
OpenHands
Gemini 3.1 Flash Lite
16.0
20.1
+4.1
4.9
261/261
Mean
33.9
50.5
+16.6
25.5
4698/4698
Key observations.
• Curated Skills improve performance by +16.6 pp on average (range: +4.1 to +25.7 pp),
corresponding to a normalized gain of 25.5%.
• OpenHands + GPT-5.5 achieves the highest absolute pass rate (67.3%) with Skills.
29
• OpenHands + GLM 5.1 shows the largest absolute improvement (+25.7 pp), while Gemini
CLI + Gemini 3.1 Pro has the highest normalized gain (38.7%).
• The current public snapshot is complete for all 18 model–harness configurations.
Figure 14 breaks the same aggregate down by model family in the time–performance plane (mean
agent wall-clock per task; measurement details in Appendix L.4): every family improves with curated
Skills, none at a material time cost.
0%
20%
40%
60%
OpenAI
GPT-5.5
GPT-5.5 (Codex)
GPT-5.4 Mini
Google
3.1 Pro (CLI)
3.1 Pro
3.5 Flash
3.1 Flash Lite
Zhipu
GLM 5.1
Anthropic
Opus 4.8
Opus 4.7 (CC)
Sonnet 4.6
Opus 4.7
60m
15m
4m
0%
20%
40%
60%
MiniMax
MiniMax M3
MiniMax M2.7
60m
15m
4m
Moonshot
Kimi K2.6
60m
15m
4m
DeepSeek
DeepSeek V4 Pro
DeepSeek V4 Flash
60m
15m
4m
xAI
No Skills
Curated Skills
Grok 4.3
Mean agent wall-clock per task (minutes, log scale)
Resolution Rate (%)
Figure 14: Per-family shift from no Skills (hollow) to curated Skills (solid) in the time–performance
plane; gray shows the remaining fleet.
I.1
