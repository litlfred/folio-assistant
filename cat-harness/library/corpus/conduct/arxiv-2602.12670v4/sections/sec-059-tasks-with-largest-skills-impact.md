---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-059-tasks-with-largest-skills-impact
section_title: "Tasks With Largest Skills Impact"
section_number: null
pages: 32-33
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
Table 13 lists the 10 tasks where Skills produced the largest improvement in pass rate. These tasks
share a common pattern: they require domain-specific procedural knowledge (e.g., cache behavior,
intrusion detection, financial reporting schemas, scientific data processing pipelines, optimization, and
artifact conversion) that is well-suited to being encoded in Skill documents. The average improvement
for these top-10 tasks is +67.0 percentage points.
32
Table 13: Tasks with largest Skills impact (With Skills pass rate −No Skills pass rate), using the
latest fixed three-trial denominator.
Task
No Skills
With Skills
∆
llm-prefix-cache-replay
1.9%
94.4%
+92.6 pp
dapt-intrusion-detection
0.0%
81.5%
+81.5 pp
sec-financial-report
0.0%
68.5%
+68.5 pp
flood-risk-analysis
1.9%
68.5%
+66.7 pp
protein-expression-analysis
11.1%
77.8%
+66.7 pp
earthquake-plate-calculation
3.7%
68.5%
+64.8 pp
software-dependency-audit
1.9%
61.1%
+59.3 pp
threejs-structure-parser
0.0%
59.3%
+59.3 pp
lake-warming-attribution
5.6%
61.1%
+55.6 pp
manufacturing-fjsp-optimization
0.0%
55.6%
+55.6 pp
K
