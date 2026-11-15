---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-026-benchmark-report-template
section_title: "Benchmark Report Template"
section_number: null
pages: 17-18
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
For each task, reviewers produce a structured report documenting:
17
1. Task metadata: Name, category, difficulty, tags, description, Skills provided, key require-
ments.
2. Oracle results: Pass/fail status, reward, tests passed, timing.
3. Agent results: Pass rates per agent-model combination, with and without Skills, including
execution time.
4. Skills impact: Quantified comparison of with-Skills vs. without-Skills performance per
agent.
5. Failure analysis: Per-test breakdown of failures including actual vs. expected output, root
cause, and evidence from trajectories.
6. Recommendation: One of: APPROVE, APPROVE WITH CAVEATS, MAJOR CHANGES
NEEDED, or REJECT.
B.9
