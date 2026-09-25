---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-062-token-usage-and-cost-by-configuration
section_title: "Token Usage and Cost by Configuration"
section_number: null
pages: 34-34
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
Table 15 reports mean total tokens per trial (prompt + completion, as recorded by the harness) and
mean LiteLLM cost per trial, separately for the no-Skills and curated-Skills conditions.
Table 15: Mean per-trial token usage and cost in the latest 18-configuration aggregate, by Skills
condition. Tok = mean total tokens per trial (thousands); $ = mean LiteLLM-computed cost per trial.
Cells with fewer than 20 usable trials are shown as “–”; “–” in a $ column also marks a provider
not priced through our LiteLLM runtime. Claude Code counts are session-JSONL-derived and
approximate.
No Skills
Curated Skills
Harness
Model
Tok (K)
$
Tok (K)
$
OpenHands
GPT-5.5
1,197
1.73
1,267
1.67
Gemini CLI
Gemini 3.1 Pro
1,165
–
1,932
–
OpenHands
GLM 5.1
2,371
–
2,117
–
Codex
GPT-5.5
3,222
3.08
3,227
2.99
Claude Code
Opus 4.7†
4,332
5.21
6,425
6.74
OpenHands
Claude Opus 4.7
1,771
10.99
1,094
6.37
OpenHands
Claude Opus 4.8
2,914
22.70
2,432
14.02
OpenHands
Gemini 3.1 Pro
1,818
0.84
4,018
1.88
OpenHands
MiniMax M3
4,718
–
4,404
–
OpenHands
Gemini 3.5 Flash
2,827
1.24
2,675
1.18
OpenHands
Kimi K2.6
2,157
–
2,103
–
OpenHands
DeepSeek V4 Pro
1,832
–
1,687
–
OpenHands
Claude Sonnet 4.6
1,834
12.34
2,874
10.15
OpenHands
Grok 4.3
489
–
579
–
OpenHands
DeepSeek V4 Flash
1,923
–
2,449
–
OpenHands
MiniMax M2.7
1,517
–
2,969
–
OpenHands
GPT-5.4 Mini
1,282
0.25
1,393
0.30
OpenHands
Gemini 3.1 Flash Lite
3,186
0.15
4,828
0.22
†Claude Code token counts are derived from session JSONL logs and are approximate (effective input includes cache-creation
and cache-read tokens).
L.2
