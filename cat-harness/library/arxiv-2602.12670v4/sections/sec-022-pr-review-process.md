---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-022-pr-review-process
section_title: "PR Review Process"
section_number: null
pages: 16-17
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
Each submitted task undergoes a multi-stage review:
1. Automated CI: Structural validation (bench tasks check), oracle execution (bench
eval create –agent oracle, must pass 100%), and AI-detection screening (GPTZero)
on the task.md instruction body.
16
2. Maintainer review: Evaluates data validity, task realism, oracle quality, Skill quality, and
anti-cheating robustness. Reviewers run benchmark experiments with and without Skills
across multiple agents.
3. Benchmark report: For each task, reviewers produce a structured report documenting
oracle results, agent pass rates with and without Skills, failure analysis, and a final verdict
(approve, major changes needed, or reject).
Of 400 candidate submissions from 142 contributors, 87 tasks passed all review stages and are
included in the current benchmark inventory (22% acceptance rate). The empirical study reports
near-complete paired public trajectories for the 87-task evaluation.
B.5
