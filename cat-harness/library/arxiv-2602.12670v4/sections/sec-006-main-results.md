---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-006-main-results
section_title: "Main Results"
section_number: null
pages: 5-7
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
Table 2 reports pass rates for each model–harness combination, ordered by with-Skills performance.
Finding 1: Skills provide broad but non-uniform gains.
Every one of the 18 model–harness
configurations improves with curated Skills (Figure 1). The average gain is +16.6 pp, but the spread is
large (+4.1 to +25.7 pp): most configurations see double-digit gains, while OpenHands + Gemini 3.1
Flash Lite is nearly flat (+4.1 pp). Skill efficacy is therefore an empirical property of a specific agent
stack rather than a universal constant.
Finding 2: The strongest absolute systems are not always the largest beneficiaries.
The highest
with-Skills pass rates are OpenHands + GPT-5.5 (67.3%), Codex + GPT-5.5 (66.5%), and Claude
Code + Opus 4.7 (61.2%). The largest lifts instead come from OpenHands + GLM 5.1 (+25.7 pp;
38.1% normalized gain), Gemini CLI + Gemini 3.1 Pro (+24.8 pp), and OpenHands + DeepSeek V4
Pro (+23.2 pp). Conversely, OpenHands + Gemini 3.5 Flash starts from a strong no-Skills baseline
(41.1%) but gains only +7.1 pp, showing that high base capability does not imply high Skill leverage.
5
Table 2: Pass rates (%), absolute gain (∆, pp), and normalized gain (g, %) across the latest 87-task
no-Skills vs. curated-Skills aggregate. ∆and g are computed at full precision; configurations are
ordered by Curated-Skills pass rate. The Mean-row g macro-averages per-configuration normalized
gains rather than recomputing g from the mean pass rates. Each pass cell uses the fixed 87 × 3 trial
frame; per-cell public coverage is reported in Appendix I. Differences from rounded Pass cells may
differ by ±0.1 pp.
No Sk.
Curated Skills
Harness
Model
Pass
Pass
∆(pp)
g (%)
OpenHands
GPT-5.5
51.5
67.3
+15.8
32.6
Codex
GPT-5.5
46.8
66.5
+19.7
37.0
Claude Code
Opus 4.7
43.0
61.2
+18.2
31.9
Gemini CLI
Gemini 3.1 Pro
36.0
60.8
+24.8
38.7
OpenHands
GLM 5.1
32.7
58.4
+25.7
38.1
OpenHands
Claude Opus 4.8
45.7
54.1
+8.4
15.5
OpenHands
Kimi K2.6
33.4
54.0
+20.6
31.0
OpenHands
Claude Opus 4.7
42.1
53.1
+11.1
19.1
OpenHands
MiniMax M3
29.7
53.0
+23.3
33.2
OpenHands
Gemini 3.1 Pro
33.8
52.8
+19.0
28.7
OpenHands
DeepSeek V4 Pro
26.9
50.1
+23.2
31.8
OpenHands
Gemini 3.5 Flash
41.1
48.2
+7.1
12.1
OpenHands
Claude Sonnet 4.6
33.5
47.2
+13.6
20.5
OpenHands
DeepSeek V4 Flash
27.5
44.7
+17.2
23.7
OpenHands
Grok 4.3
22.8
41.7
+18.8
24.4
OpenHands
GPT-5.4 Mini
29.9
41.4
+11.5
16.4
OpenHands
MiniMax M2.7
18.1
34.9
+16.8
20.5
OpenHands
Gemini 3.1 Flash Lite
16.0
20.1
+4.1
4.9
Mean
33.9
50.5
+16.6
25.5
Gemini 3.1
Flash Lite
(OH)
MiniMax
M2.7
(OH)
GPT-5.4
Mini
(OH)
Grok 4.3
(OH)
DeepSeek
V4 Flash
(OH)
Claude
Sonnet 4.6
(OH)
Gemini 3.5
Flash
(OH)
DeepSeek
V4 Pro
(OH)
Gemini 3.1
Pro
(OH)
MiniMax
M3
(OH)
Claude
Opus 4.7
(OH)
Kimi K2.6
(OH)
Claude
Opus 4.8
(OH)
GLM 5.1
(OH)
Gemini 3.1
Pro
(GCLI)
Claude
Opus 4.7
(CC)
GPT-5.5
(Codex)
GPT-5.5
(OH)
0.0
0.1
0.2
0.3
0.4
0.5
0.6
0.7
0.8
0.9
1.0
Resolution Rate
No Skills
DeepSeek
Skill Lift
Moonshot
Skill Invocation Rate
Zhipu
OpenAI
MiniMax
Anthropic
xAI
Google
0.0
0.1
0.2
0.3
0.4
0.5
0.6
0.7
0.8
0.9
1.0
Skill Invocation Rate
Figure 5: Task-specific Skill Invocation Rate alongside resolution rates. Left axis: stacked resolution-
rate bars (no-Skills baseline plus curated-Skills lift). Right axis: adjacent hatched Skill Invocation
Rate bars. Open/filled circles mark 95% CIs for no-Skills/with-Skills resolution rates; black diamonds
mark invocation-rate CIs.
Finding 3: Harness choice materially changes how the same model uses Skills.
Fig. 1 includes
three model families evaluated under multiple harnesses. GPT-5.5 reaches 67.3% with Skills in
OpenHands and 66.5% in Codex; Gemini 3.1 Pro reaches 60.8% in Gemini CLI but 52.8% in
OpenHands; Claude Opus 4.7 reaches 61.2% in Claude Code and 53.1% in OpenHands. Skills are
therefore not merely extra context: the harness’s discovery, prompting, execution, and tool-use loop
mediate realized benefit. Appendix I reports the per-configuration public-trial counts.
Finding 4: Skill discovery is usually not the bottleneck.
Figure 5 separates harness-bundled
Skills, treated as part of the harness, from task-specific Skills shipped with each benchmark task. We
count only the latter: a curated-Skills trial counts when its trajectory reads or invokes a Skill under
6
Table 3: Skills efficacy (%) by domain across the latest 87-task benchmark set. N is the number of
tasks per domain. Pass rates use a fixed three-trial denominator within each (condition, config, task),
then macro-average across tasks and 18 model–harness configurations; all domains show positive
aggregate delta.
Domain
N
No Skills
With Skills
∆abs
Natural Science
14
42.0%
70.8%
+28.8
Media & Content Production
5
23.3%
47.4%
+24.1
Cybersecurity
7
29.5%
48.4%
+18.9
Industrial & Physical Systems
14
23.9%
39.6%
+15.7
Finance & Economics
9
19.1%
33.3%
+14.2
Office & White Collar
14
40.5%
53.0%
+12.6
Software Engineering
16
37.6%
49.2%
+11.6
Mathematics & OR
8
45.7%
55.4%
+9.7
that task’s environment/skills. High Skill Invocation Rate does not guarantee high resolution, so
the remaining failures often occur after task-Skill access. Exact counts are in Appendix K.
Self-generated Skills do not substitute for curated ones.
On the three dedicated-harness con-
figurations we additionally evaluate a self-generated condition: the agent first authors skill packs
with Anthropic’s skill-creator, then solves each task with only those packs (Appendix D.6).
Self-generated Skills land below the no-Skills baseline on all three configurations (−8.1 pp on Claude
Code + Opus 4.7, −11.3 pp on Codex + GPT-5.5, −11.5 pp on Gemini CLI + Gemini 3.1 Pro), while
curated Skills add +18.2 to +24.8 pp on the same configurations. A trajectory audit attributes the
deficit to generated packs the solver never discovers, creator-side authoring that displaces solver
work, and confidently wrong pack content when the skills are used (Appendix D.6.1).
5.1.2
