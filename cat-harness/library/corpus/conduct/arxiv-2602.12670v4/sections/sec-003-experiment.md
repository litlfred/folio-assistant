---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-003-experiment
section_title: "Experiment"
section_number: null
pages: 5-5
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
Models, harnesses, and conditions. For the latest aggregate in Table 2, we evaluate 18 config-
urations across four terminal-agent harnesses: OpenHands, Gemini CLI [Google, 2025], Claude
Code [Anthropic, 2025b], and Codex CLI [OpenAI, 2025]. Each task runs under two matched condi-
tions: no Skills (the task instruction only) and curated Skills (the task’s full environment/skills/
directory). A third self-generated Skills condition—the agent first authors skill packs with Anthropic’s
skill-creator, then solves with only those packs—is evaluated on the three dedicated-harness
configurations and reported separately (Appendix D.6).
Evaluation harness and protocol. We instantiate SKILLSBENCH on BenchFlow [BenchFlow
team, 2026], an open-source multi-turn agent benchmarking framework with uniform Skill injection,
sandboxing, and trajectory logging. For each (configuration, task, condition) triple, BenchFlow builds
a fresh pinned container, hands the agent the task instruction (and Skills under the relevant condition),
and runs until final submission. The deterministic test-script verifier then emits a pass/fail result.
Unscored, stale, or rate-limited trajectories are treated as incomplete coverage for rerun/audit; timeout
rows are used only when healthy pass/fail replacements are unavailable and then scored as failures.
The latest aggregate targets three selected public trials per (configuration, task, condition) cell against
the fixed 87 × 3 frame.
Metrics.
The primary metric is task-macro pass rate, following Terminal-Bench [Merrill et al.,
2026]: per-task pass/fail outcomes are averaged over the three-trial frame, then across the fixed
87-task inventory. We complement this with normalized gain [Hake, 1998]
g = (passskill −passvanilla) / (1 −passvanilla),
(1)
which measures the fraction of remaining headroom Skills close. Because every condition runs on
the same task in the same container, deltas are paired differences at the (configuration, task) level,
not unpaired-pool differences. Aggregation rules and per-cell trial counts are in Appendix N. For
rows that summarize multiple configurations, we compute g separately for each configuration at full
precision and macro-average those normalized gains, so the reported mean g can differ slightly from
recomputing g from mean pass rates.
5
