---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-051-skill-author-patterns-audit
section_title: "Skill-Author Patterns Audit"
section_number: null
pages: 28-29
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
We
audited
paired
trajectories
(with-Skills
vs.
no-Skills)
on
the
10
highest-∆
tasks
(Top-10 in §5, mean +67.0 pp) to extract concrete authoring patterns.
The five pat-
terns summarized in §6’s “Implications for Skill authoring” paragraph are:
(1) ship
an
executable
script
with
calibrated
defaults
rather
than
only
describing
the
algo-
rithm (llm-prefix-cache-replay, sec-financial-report); (2) name the canonical data
28
source and parsing quirk (flood-risk-analysis, dapt-intrusion-detection); (3) en-
code the exact file-format constraint the verifier inspects (threejs-structure-parser);
(4) surface the algorithmic invariant the verifier asserts (protein-expression-analysis,
earthquake-plate-calculation,
manufacturing-fjsp-optimization);
(5) make the
Skill’s description: frontmatter so task-specific that the agent matches it on the first scan. Each
pattern is grounded in paired trajectory excerpts, available alongside the released trajectories.
G
