---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-057-success-case-studies
section_title: "Success Case Studies"
section_number: null
pages: 31-32
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
We present representative examples where curated Skills transformed agent outcomes from failure to
success, illustrating the mechanisms through which procedural knowledge improves performance.
Skills bridge domain-specific API gaps: sales-pivot-analysis.
Without Skills, evaluated
agents rarely solved this task, which requires creating Excel pivot tables programmatically from
population and income data. Agents consistently loaded the data correctly but failed at pivot table
creation—Codex attempted manual DataFrame reshaping instead of using openpyxl’s pivot table
API, producing structurally incorrect output (10/23 tests failed with “list index out of range” on
missing pivot objects). With Skills providing step-by-step guidance for the openpyxl pivot table
workflow, average pass rate rises from 1.9% to 40.7% (+38.9 pp).
Skills provide critical data processing pipelines: flood-risk-analysis.
This task requires
identifying flood-risk stations from USGS streamflow data using return period estimation. Without
Skills, agents attempted ad-hoc statistical approaches—e.g., simple threshold-based detection or
incorrect distribution fitting—achieving only 1.9% pass rate. The curated Skill specified the Log-
Pearson Type III distribution, the standard USGS methodology for flood frequency analysis, including
the exact scipy function calls and parameter interpretation. With Skills, pass rate rose to 68.5%
(+66.7 pp), with many configurations correctly applying the USGS-standard methodology.
Skills encode regulatory knowledge: sec-financial-report.
Analyzing hedge fund activities
from SEC 13F filings requires understanding specific regulatory formats, CIK lookup procedures,
and filing comparison methodology. Without Skills, no model could complete the task (0% pass
rate)—agents either failed to locate the correct filings or misinterpreted the tabular data format. The
31
curated Skill documented the SEC EDGAR API endpoints, 13F-HR filing structure, and cross-quarter
comparison methodology. With Skills, pass rate reached 68.5% (+68.5 pp).
Skills prevent common implementation pitfalls: manufacturing-fjsp-optimization.
The
flexible job-shop scheduling problem requires constraint-aware optimization with machine downtime
windows. Without Skills, agents produced naive schedules ignoring maintenance constraints (0% pass
rate). The curated Skill outlined the constraint propagation approach, objective function formulation,
and OR-Tools solver configuration. With Skills, agents successfully formulated and solved the
optimization problem in a subset of configurations (55.6% pass rate, +55.6 pp).
J.2
