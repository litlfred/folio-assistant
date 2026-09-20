---
doc_id: arxiv-2608.08453v1
doc_title: "What Keeps Agent Skills from Being Reusable? Evidence from 138K SKILL.md Files"
section_id: sec-012-42-rq1-what-reusability-defects-are-prevalent-in
section_title: "RQ1: What reusability defects are prevalent in public skills?"
section_number: 4.2
pages: 4-4
source_pdf: 2608.08453v1.pdf
source_sha256: dd50ffb3d44d7a3c
---
public skills?
The first step is prevalence: if detected defects are rare,
reusable-skill quality is mainly an edge-case problem; if they
are common, quality control must become part of the skill
generation and publication workflow. Of 138,133 skills an-
alyzed, 89.3% trigger at least one Tier 1 detector derived
from the official Agent Skills specification, and 91.8% have
at least one detected defect of any tier. The average skill
contains 2.5 detected defects (median: 2). Figure 2 shows
prevalence by category. This prevalence result should be
read as an ecosystem-level quality signal: some detected de-
fects block routing or create safety risk, while others mostly
waste context or indicate weak packaging.
Spec conformance defects dominate. The three most
prevalent individual defects are all spec violations: R1.3 miss-
ing trigger guidance (52.3%), R2.4 name-as-heading dupli-
cation (44.3%), and R3.2 too many inline examples (32.1%).
67.0% of skills have at least one routing defect; combined
with R1.4 (13.5%, non-functional descriptions), over half of all
skills have descriptions that cannot effectively guide agent
routing.
4.3
