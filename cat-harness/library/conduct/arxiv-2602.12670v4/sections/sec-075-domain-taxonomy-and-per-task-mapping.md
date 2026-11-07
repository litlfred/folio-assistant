---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-075-domain-taxonomy-and-per-task-mapping
section_title: "Domain Taxonomy and Per-Task Mapping"
section_number: null
pages: 38-42
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
We classify each released task into one of eight domains. The taxonomy uses broad top-level labels
for professional context while preserving finer distinctions in task metadata. Cybersecurity and Media
& Content Production are currently below N = 8, so per-domain inferential claims should treat those
slices as descriptive until additional tasks are added.
Table 19 lists every task in the current 87-task inventory, its primary capability axis (a separate
cut from the goodtask-v2 framework: Reasoning, Agentic Coding, Multimodal, Tool Use, or
Search & Research), and its difficulty marker. The mapping is generated automatically from
scripts/taxonomy.csv by scripts/distribution.py so it stays in sync with the figures refer-
enced in §3.
38
Table 19: Per-domain task listing for the released 87-task SKILLSBENCH. Difficulty marker: C=Core
(<60 min), X=Extended (1–4 h), E=Extreme (>4 h). Capability is the primary skill the task exercises.
Task
Capability
Diff.
Software Engineering (n = 16). Code implementation, debugging, build repair, migration, testing, repo
analytics.
azure-bgp-oscillation-route-leak
Reasoning
X
data-to-d3
Agentic Coding
X
debug-trl-grpo
Agentic Coding
E
dialogue-parser
Agentic Coding
C
fix-build-agentops
Agentic Coding
C
fix-build-google-auto
Agentic Coding
C
fix-visual-stability
Agentic Coding
E
flink-query
Agentic Coding
E
jax-computing-basics
Agentic Coding
X
llm-prefix-cache-replay
Agentic Coding
X
parallel-tfidf-search
Agentic Coding
X
python-scala-translation
Agentic Coding
X
react-performance-debugging
Agentic Coding
E
simpo-code-reproduction
Agentic Coding
E
spring-boot-jakarta-migration
Agentic Coding
E
tictoc-unnecessary-abort-detection
Reasoning
E
Industrial & Physical Systems (n = 14). Power systems, manufacturing, robotics/control, construction,
and physical simulation.
3d-scan-calc
Reasoning
E
ada-bathroom-plan-repair
Reasoning
E
adaptive-cruise-control
Reasoning
X
drone-planning-control
Reasoning
X
dynamic-object-aware-egomotion
Reasoning
X
energy-ac-optimal-power-flow
Reasoning
X
energy-market-pricing
Reasoning
E
energy-unit-commitment
Reasoning
E
grid-dispatch-operator
Reasoning
X
hvac-control
Reasoning
X
manufacturing-codebook-normalization
Reasoning
X
manufacturing-equipment-maintenance
Reasoning
X
manufacturing-fjsp-optimization
Reasoning
X
r2r-mpc-control
Reasoning
X
Natural Science (n = 14). Astronomy, seismology, hydrology, materials, physics, and biomedical analysis.
crystallographic-wyckoff-position-analysis
Reasoning
X
earthquake-phase-association
Reasoning
E
earthquake-plate-calculation
Reasoning
X
exoplanet-detection-period
Reasoning
X
flood-risk-analysis
Reasoning
X
glm-lake-mendota
Reasoning
E
(continued on next page)
39
(continued from previous page)
Task
Capability
Diff.
gravitational-wave-detection
Reasoning
X
lab-unit-harmonization
Reasoning
X
lake-warming-attribution
Reasoning
X
mars-clouds-clustering
Reasoning
E
protein-expression-analysis
Reasoning
X
quantum-numerical-simulation
Reasoning
X
radar-vital-signs
Reasoning
X
seismic-phase-picking
Reasoning
E
Office & White Collar (n = 14). Office documents, spreadsheets, presentations, forms, PDFs, OCR, and
enterprise search.
citation-check
Search & Research
X
court-form-filling
Tool Use
C
edit-pdf
Tool Use
X
enterprise-information-search
Search & Research
E
exceltable-in-ppt
Tool Use
X
jpg-ocr-stat
Multimodal
E
latex-formula-extraction
Multimodal
X
offer-letter-generator
Tool Use
C
organize-messy-files
Tool Use
X
paper-anonymizer
Multimodal
X
pdf-excel-diff
Multimodal
X
powerlifting-coef-calc
Tool Use
C
pptx-reference-formatting
Tool Use
X
sales-pivot-analysis
Tool Use
X
Finance & Economics (n = 9). Financial modeling, accounting, macroeconomic analysis, risk, and fraud
workflows.
econ-detrending-correlation
Tool Use
X
financial-modeling-qa
Multimodal
E
invoice-fraud-detection
Multimodal
E
reserves-at-risk-calc
Tool Use
X
sec-financial-report
Search & Research
E
shock-analysis-demand
Tool Use
X
shock-analysis-supply
Tool Use
E
weighted-gdp-calc
Tool Use
X
xlsx-recover-data
Tool Use
X
Mathematics & OR (n = 8). Formal proofs, optimization, planning, routing, scheduling, and combinato-
rial reasoning.
bike-rebalance
Reasoning
X
civ6-adjacency-optimizer
Reasoning
E
exam-block-sequencing
Reasoning
E
lean4-proof
Reasoning
X
paratransit-routing
Reasoning
E
pddl-airport-planning
Reasoning
X
(continued on next page)
40
(continued from previous page)
Task
Capability
Diff.
pddl-tpp-planning
Reasoning
X
travel-planning
Search & Research
X
Cybersecurity (n = 7). CVE remediation, IDS, fuzzing, dependency audit, network security.
dapt-intrusion-detection
Multimodal
E
fix-druid-loophole-cve
Agentic Coding
E
fix-erlang-ssh-cve
Agentic Coding
E
setup-fuzzing-py
Agentic Coding
X
software-dependency-audit
Search & Research
X
suricata-custom-exfil
Multimodal
X
syzkaller-ppdev-syzlang
Agentic Coding
X
Media & Content Production (n = 5). Video, audio, 3D content, dubbing, media transformation, and
content production.
mario-coin-counting
Multimodal
X
multilingual-video-dubbing
Multimodal
X
threejs-structure-parser
Multimodal
X
threejs-to-obj
Multimodal
X
video-silence-remover
Multimodal
E
41
N
