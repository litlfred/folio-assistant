---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-050-failure-modes-when-skills-hurt
section_title: "Failure Modes when Skills Hurt"
section_number: null
pages: 28-28
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
We audited paired (with-Skills, no-Skills) trajectories on tasks with negative deltas. The latest
aggregate changes the task ordering, but the same three repeatable patterns remain:
• Pattern
A:
heavyweight
pipeline
crowds
out
simpler
execution.
Tasks:
adaptive-cruise-control
(−5.6 pp),
r2r-mpc-control
(−5.6 pp),
dynamic-object-aware-egomotion (−1.9 pp).
The Skill points agents toward more
principled but heavier optimization workflows, which can crowd out a simpler path to a valid
answer. Implication: authors should mark optional steps and supply a fast path.
• Pattern
B:
Skill
activation
displaces
a
stronger
native
strategy.
Tasks:
exam-block-sequencing
(−7.4 pp),
econ-detrending-correlation
(−5.6 pp),
python-scala-translation (−1.9 pp).
A generic recipe can suppress a stronger direct
coding or debugging strategy. Implication: Skills should include applicability boundaries, not just
preferred procedures.
• Pattern C: Skill points the agent at a solver it can’t debug. Tasks: suricata-custom-exfil
(−7.4 pp), mars-clouds-clustering (−5.6 pp), fix-erlang-ssh-cve (−3.7 pp). When a
Skill mandates a brittle framework or schema, agents inherit a steeper debug surface and can fail
before the model reaches a correct artifact. Implication: Skills should provide debugging fallbacks
and validation checks.
F.4
