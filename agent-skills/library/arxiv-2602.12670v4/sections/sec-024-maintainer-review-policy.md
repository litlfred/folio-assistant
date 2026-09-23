---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-024-maintainer-review-policy
section_title: "Maintainer Review Policy"
section_number: null
pages: 17-17
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
Maintainers evaluate each submission against seven criteria:
1. AI detection: Verify the task.md instruction and configuration are manually written using
GPTZero and human review. PRs with intentional grammar errors designed to circumvent
AI detectors are closed.
2. Data quality: Data must be real-world and appropriately complex. AI-generated or toy data
is rejected.
3. Task validity: Tasks must be grounded in realistic professional scenarios. Artificially
inflated complexity is rejected.
4. Oracle quality: Simple solutions (e.g., an Excel formula or short script) are preferred over
over-engineered oracle implementations.
5. Author history: Authors flagged multiple times across PRs are closed automatically.
6. Test parsimony: Fewer than 10 test cases unless justified; tests should cover distinct criteria
rather than repeat similar checks.
7. Multimodal verification: For multimodal tasks (audio, PPTX, video, PDF), maintainers
personally inspect agent output to verify correctness beyond programmatic assertions.
B.7
