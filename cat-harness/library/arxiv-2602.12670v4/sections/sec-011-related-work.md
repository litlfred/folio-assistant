---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-011-related-work
section_title: "Related Work"
section_number: null
pages: 8-9
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
We situate SKILLSBENCH within agent benchmarks, procedural augmentation, and evaluation
methodology.
8
Agent benchmarks. Recent benchmarks evaluate end-to-end agent capability across realistic environ-
ments, including Terminal-Bench [Merrill et al., 2026], SWE-bench and follow-ons [Jimenez et al.,
2024, Yang et al., 2024, 2025], AgentBench and web/GUI settings [Liu et al., 2023, Zhou et al., 2024b,
Koh et al., 2024, Xie et al., 2024], and suites for tool-mediated workflows, execution feedback, or
domain specialization [Yao et al., 2025, Trivedi et al., 2024, Yang et al., 2023, Chan et al., 2025, Zhang
et al., 2024, Zhuo et al., 2025, Austin et al., 2021, Ye et al., 2025]. These benchmarks measure fixed-
agent task completion. SKILLSBENCH instead measures augmentation efficacy via paired evaluation.
Procedural augmentation and tool use. Prior work augments agents with structured reasoning or
external knowledge, including CoALA and Voyager [Sumers et al., 2024, Wang et al., 2023a], multi-
step reasoning methods [Wei et al., 2022, Yao et al., 2023a,b, Shinn et al., 2023, Madaan et al., 2023,
Zhou et al., 2023a, 2024a], retrieval and tool use [Lewis et al., 2020, Zhou et al., 2023b, Schick et al.,
2023, Qin et al., 2024], and declarative optimization frameworks [Khattab et al., 2023]. Skills combine
procedural guidance with executable resources (§2); SKILLSBENCH quantifies their actual impact.
Skills ecosystems and evaluation methodology. Anthropic’s Agent Skills and MCP specifica-
tions [Anthropic, 2025a, 2024] formalized Skill packages and tool connectivity, and agent CLIs
provide real-world harnesses [Anthropic, 2025b, Google, 2025, OpenAI, 2025]. SKILLSBENCH
runs on BenchFlow [BenchFlow team, 2026] and uses Terminal-Bench scoring [Merrill et al., 2026]
for comparability.
Paired evaluation of agent augmentations. The closest methodological precedent is paired evalua-
tion of inference-time augmentations on enterprise API workflows, which contrasts with-vs.-without
conditions on the same task and reports paired bootstrap CIs [Liu et al., 2023]. SKILLSBENCH
adopts this paired-condition design while decoupling tasks from independently authored Skills and
spanning 8 expertise-heavy domains rather than a single workflow class. Broader benchmarking
practice motivates careful reporting and comparability [Mattson et al., 2020, Chiang et al., 2024,
Srivastava et al., 2023]; we therefore report both absolute gains and normalized gain [Hake, 1998]
across No-Skills baselines (§4).
8
