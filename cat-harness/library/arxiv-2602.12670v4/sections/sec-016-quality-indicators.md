---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-016-quality-indicators
section_title: "Quality Indicators"
section_number: null
pages: 14-15
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
We developed a quality scoring rubric based on:
14
1
2
3
4
5
6
7
8
9
10
11
12
13
14 15+
Number of files in Skill bundle (excluding metadata.json)
0
100K
200K
300K
400K
Number of Skills
n = 767,430
Median = 1
59.9% have only SKILL.md
86.4% have ≤5 files
(a)
0
500K
1M
1.5M
2M
2.5M
Number of files (top 12 of 1,825 extensions; 4,272,636 total)
.md
.py
.ts
.js
.json
(no extension)
.map
.sh
.txt
.svg
.yaml
.png
2.21M (51.7%)
293K (6.9%)
260K (6.1%)
242K (5.7%)
206K (4.8%)
144K (3.4%)
86K (2.0%)
72K (1.7%)
65K (1.5%)
52K (1.2%)
51K (1.2%)
45K (1.1%)
(b)
Figure 9: Structural patterns of Skill bundles in the reachable-clone sample. (a) File count per bundle
(n=767,430, excluding metadata.json); most Skills are minimal, with 86.4% containing five files
or fewer. (b) Top 12 file extensions across the 4.27M files in the sample (out of 1,825 distinct
extensions); markdown dominates at 51.7%, with Python, TypeScript, JavaScript, and JSON as the
next most common.
1. Completeness: Presence of required components (0–3 points)
2. Clarity: Readability and organization (0–3 points)
3. Specificity: Actionable vs. vague guidance (0–3 points)
4. Examples: Presence and quality of examples (0–3 points)
Mean quality score across the ecosystem is 6.2/12 (SD=2.8), indicating substantial room for improve-
ment in Skill authoring practices.
A.4
