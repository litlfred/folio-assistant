---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-009-discussion
section_title: "Discussion"
section_number: null
pages: 8-8
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
Skills close procedural gaps. Skills are most helpful when success depends on concrete procedures
and verifier-facing details (steps, constraints, sanity checks), rather than broad conceptual knowledge.
Gains are largest for specialized workflows or brittle formats, and smaller or negative when models
already have strong priors or the Skill adds overhead.
Harnesses mediate Skills use. Skills efficacy depends not only on Skills quality but also on harness
implementation. Some harnesses reliably retrieve and use Skills, while others acknowledge Skills
content but proceed without invoking it. Structured interfaces can also introduce long-trajectory
failure modes (e.g., format drift), reducing the influence of early-injected Skills. This motivates
evaluating Skills under multiple harnesses rather than treating “with Skills” as a single condition.
Implications for Skill authoring. Trajectory audit on the 10 highest-∆tasks (Appendix F.4)
yields five recurring patterns: executable scripts with calibrated defaults, canonical data sources
and parsing quirks, verifier-facing file-format constraints, algorithmic invariants, and task-specific
description: frontmatter for first-scan matching. Comprehensive prose is essentially flat while
focused documentation yields larger aggregate lift (+0.7 pp vs. +19.0/+21.5 pp; Appendix F); Skill
authors should optimize for verifier-facing detail an agent cannot infer, not for completeness.
Complexity-aware fallback paths for Skills. The three failure modes that drive negative deltas
(Appendix F.3) all share the same root cause: the Skill prescribes a pipeline that is correct in principle
but too heavy or brittle for routine agent execution. We propose extending the SKILL.md frontmatter
with an explicit complexity contract: expected tool and token cost, applicability boundaries, and a
required lightweight fallback path. This would help agents route around heavy recipes when the
task evidence does not justify them, and it would force Skill authors to state when their “correct”
workflow assumes unusually expensive computation.
6.1
