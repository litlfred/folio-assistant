---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-068-task-package
section_title: "Task Package"
section_number: null
pages: 36-37
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
Each task is a self-contained module with four required components:
• Instruction. A human-readable task description specifying the objective, input format, constraints,
and expected output. Instructions are written to be solvable by a knowledgeable human without
access to the paired Skills, though Skills may substantially reduce time-to-solution.
36
• Environment. A Docker container with task-specific data files and a skills/ subdirectory
containing modular Skills packages. Containerization provides isolated dependencies and clean
file-system state.
• Oracle. A reference solution demonstrating that the task is resolvable. The oracle must pass the
verifier with 100% success before a task can be accepted. (The on-disk directory is oracle/.)
• Verifier. Deterministic test scripts with programmatic assertions, including numeric tolerances
where appropriate. This yields reproducible pass/fail judgments without LLM-as-a-judge variance.
(The on-disk directory is verifier/.)
M.3
