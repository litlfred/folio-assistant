---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-008-task-level-analysis
section_title: "Task-Level Analysis"
section_number: null
pages: 7-8
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
Task-level results reveal high variance in Skills effectiveness:
Top Skills beneficiaries.
The 10 highest-∆tasks span prefix-cache replay, intrusion detection,
SEC filings, wet-lab analysis, hydrology, geoscience, 3D parsing, optimization, and dependency
auditing, with mean improvement +67.0 pp. llm-prefix-cache-replay reaches 94.4% from a
1.9% no-Skills pass rate, and dapt-intrusion-detection reaches 81.5% from zero (full list in
Appendix J.3; Skill content audit in Appendix F.4).
Failure modes when Skills hurt performance.
13 of 87 tasks show negative Skills deltas; the
largest drops occur on exam-block-sequencing (−7.4 pp), suricata-custom-exfil (−7.4 pp),
and adaptive-cruise-control / mars-clouds-clustering / r2r-mpc-control / econ-d
etrending-correlation (−5.6 pp each). Paired-trajectory audit (Appendix F.3) surfaces three
repeatable patterns: the Skill prescribes an unnecessarily heavyweight pipeline, displaces a stronger
default strategy, or points the agent at a solver it cannot debug. The common cause is a single “correct”
pipeline without applicability boundaries or lightweight fallbacks.
Finding 6: Compact, focused Skills outperform exhaustive ones, and small models with Skills
can match larger models without.
Two design ablations (Appendix F) refine the picture. First,
Skill quantity: tasks paired with one Skill gain +18.0 pp, 2–3 Skills gain +19.0 pp, and ≥4 Skills
7
give only +10.1 pp, suggesting excess content creates overhead or conflicting guidance. Second, Skill
complexity: compact and standard-length Skills (+19.0 and +21.5 pp) outperform detailed (+14.5 pp)
and comprehensive documentation (+0.7 pp); focused procedural guidance beats exhaustive prose.
Finally, scale: MiniMax M2.7 with Skills (34.9%) exceeds stronger no-Skills baselines such as
OpenHands + GLM 5.1 (32.7%) and OpenHands + MiniMax M3 (29.7%), so Skills can partly
compensate for model capacity on procedural tasks.
6
