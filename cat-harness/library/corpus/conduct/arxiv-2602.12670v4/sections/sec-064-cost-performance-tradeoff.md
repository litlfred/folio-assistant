---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-064-cost-performance-tradeoff
section_title: "Cost-Performance Tradeoff"
section_number: null
pages: 35-35
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
Per-trial cost spans roughly two orders of magnitude across the lineup. The cheapest priced con-
figurations are OpenHands + Gemini 3.1 Flash Lite ($0.15–0.22) and OpenHands + GPT-5.4 Mini
($0.25–0.30); the Gemini and GPT-5.5 configurations occupy the mid-range ($0.8–3.1 per trial); and
the Claude Opus configurations are by far the most expensive—OpenHands + Claude Opus 4.8 at
$14.02–22.70 per trial, OpenHands + Claude Opus 4.7 at $6.37–10.99, and OpenHands + Claude
Sonnet 4.6 at roughly $10–12.3. Cost does not track capability monotonically: OpenHands + GPT-5.5
attains the highest with-Skills pass rate (67.3%) at $1.67 per trial—about eight times cheaper than
OpenHands + Claude Opus 4.8 (54.1% at $14.02).
Skills do not move token usage in a single direction. Several configurations consume more to-
kens with Skills (OpenHands + Gemini 3.1 Pro 1.82M →4.02M; OpenHands + Claude Sonnet 4.6
1.83M →2.87M; OpenHands + Gemini 3.1 Flash Lite 3.19M →4.83M), consistent with the agent
reading and acting on the additional Skill context, while others consume fewer (OpenHands + Claude
Opus 4.7 1.77M →1.09M; OpenHands + Claude Opus 4.8 2.91M →2.43M; OpenHands + Gemini 3.5
Flash 2.83M →2.67M), consistent with Skills letting the model reach a solution with less exploratory
work. Where providers expose prompt-caching fields, cache reads can account for a material share of
effective input tokens, so realized cost under cached pricing can differ substantially from standard-rate
estimates.
L.4
