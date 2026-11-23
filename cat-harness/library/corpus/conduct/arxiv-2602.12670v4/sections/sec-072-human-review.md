---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-072-human-review
section_title: "Human Review"
section_number: null
pages: 37-38
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
• Structural validation: Required files must be present (task.md with oracle/solve.sh and
verifier/test_outputs.py; Appendix B), and directory layout and frontmatter syntax must
be valid.
• Oracle execution: The reference solution must achieve a 100% verifier pass rate. Tasks with
failing oracles are rejected.
• Instruction quality: Instructions must be human-written, verified through both human review
and GPTZero screening. We additionally score instructions on explicit output paths, structured
requirements, success criteria, listed constraints, and context-first ordering.
• Leakage audit: CI checks for potential Skill-solution leakage, including task-specific constants,
filenames, paths, expected outputs, and hard-coded command sequences.
M.6
Human Review
After automated checks pass, maintainers manually review each task using five criteria:
1. Data validity: Input data should reflect real-world complexity; synthetic or toy data is rejected
unless explicitly justified.
2. Task realism: Scenarios should reflect realistic professional workflows without artificial difficulty.
3. Oracle quality: Reference solutions should match how domain experts would solve the task.
37
4. Skill quality: Skills must be error-free, internally consistent, and useful for similar tasks beyond
this benchmark.
5. Anti-cheating: Tasks must prevent shortcut solutions such as editing input data, extracting answers
from test files, or exploiting verifier implementation details.
Reviewers run benchmark experiments with and without Skills across multiple agents to confirm that
each task provides meaningful signal about Skill efficacy. Figure 2 provides an end-to-end view of
the benchmark construction, quality filtering, and evaluation pipeline.
M.7
