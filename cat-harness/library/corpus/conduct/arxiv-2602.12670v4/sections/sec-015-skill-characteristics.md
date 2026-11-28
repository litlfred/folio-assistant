---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-015-skill-characteristics
section_title: "Skill Characteristics"
section_number: null
pages: 13-14
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
Size Distribution.
Skill sizes follow a heavy-tailed log-normal distribution (Figure 7). SKILL.md
instructions (panel a) have a median of 4.8 KB (∼1.2k tokens at 4 bytes/token; IQR 2.4–9.2 KB),
while total bundle size (panel b) has a median of 7.2 KB (∼1.8k tokens; IQR 3.0–17.4 KB). The tail
is dramatic: the largest Skill bundle exceeds 1.6 GB.
Domain Coverage.
Skills span 12 marketplace-assigned categories with broad coverage and no
single dominant area (Figure 8; n=1,031,651 category assignments, where a Skill may carry multiple
tags):
• Tools: 22.4% (CLIs, terminal utilities, build tools)
13
0
2,000
4,000
6,000
8,000
10,000
12,000
SKILL.md size (tokens; 1 char ≈ 0.25 tokens)
103
104
105
Number of Skills (log scale)
n = 767,425
99.5th percentile shown
(a)
Median = 1,196
0
25,000
50,000
75,000
100,000
125,000
150,000
Total bundle size (tokens, excluding metadata.json)
102
103
104
105
n = 767,425
99.0th percentile shown
(b)
Median = 1,802
Figure 7: Skill size distributions in the reachable-clone sample (n=767,425; tokens approximated
as bytes/4). (a) SKILL.md instructions, 99.5th percentile shown; median ∼1.2k tokens. (b) Total
bundle size including all resources (excluding metadata.json), 99th percentile shown; median
∼1.8k tokens. Both distributions are highly skewed toward concise artifacts but the bundle-size tail
extends several orders of magnitude.
• Business: 17.0% (workflows, productivity, ops)
• Development: 14.3% (general software engineering)
• Testing & Security: 9.8% (test scaffolds, security scans)
• Data & AI: 9.2% (data pipelines, ML, analytics)
• DevOps: 7.8% (Docker, Kubernetes, CI/CD)
• Documentation: 6.6% (technical writing, API docs)
• Content & Media: 6.0% (writing, design, media)
• Long tail: 6.9% (Research, Lifestyle, Databases, Blockchain combined)
0
5
10
15
20
25
Share of Skill assignments (%)
Tools
Business
Development
Testing Security
Data AI
DevOps
Documentation
Content Media
Research
Lifestyle
Databases
Blockchain
22.4%  (231,109)
17.0%  (175,585)
14.3%  (147,122)
9.8%  (101,355)
9.2%  (95,076)
7.8%  (80,255)
6.6%  (67,824)
6.0%  (61,538)
3.6%  (37,018)
1.4%  (14,543)
1.1%  (11,785)
0.8%  (8,441)
Figure 8: Distribution of Skill categories across 1,031,651 marketplace assignments (snapshot 2026-
04-30). No single category exceeds a quarter of the corpus, reflecting broad developer interest in
software-engineering tooling, business workflows, testing/security, and data/AI.
Structural Patterns.
Most Skills with reachable cloned source are minimal (Figure 9, panel a):
59.9% contain a single file (just SKILL.md) and 86.4% contain five or fewer files (n=767,430, median
1, mean 5.6 inflated by the long tail). The file-extension mix (panel b) confirms the ecosystem is
documentation-heavy: .md alone accounts for 51.7% of all 4.27M files, followed by .py (6.9%),
.ts (6.1%), .js (5.7%), and .json (4.8%). Natural-language instructions dominate over executable
implementations.
A.3
