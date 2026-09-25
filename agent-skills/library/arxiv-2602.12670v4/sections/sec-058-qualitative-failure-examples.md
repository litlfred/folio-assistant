---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-058-qualitative-failure-examples
section_title: "Qualitative Failure Examples"
section_number: null
pages: 32-32
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
We present representative examples drawn from verifier test outputs across failed trajectories.
Quality Below Threshold: earthquake-plate-calculation.
The agent correctly identified
the target earthquake event, extracting latitude, longitude, magnitude, and timestamp accurately (7/8
tests passed). However, the computed distance from the nearest plate boundary was 3,562 km instead
of the expected 3,878 km—an 8.2% error that exceeded the ±0.01 km tolerance. The agent applied
the correct Haversine formula but used an incorrect plate boundary coordinate, demonstrating that
even when agents understand the computational method, domain-specific data interpretation remains
error-prone.
Incomplete Solution: shock-analysis-supply.
The agent created a structurally correct Excel
workbook and passed 6 of 9 tests, correctly setting up sheet structures, formula templates, and
some data imports. However, it failed to: (1) populate employment/labor data from the Penn World
Tables (PWT), (2) execute the HP filter optimization solver, and (3) compute the depreciation rate.
These three missing components represent the most domain-specific and computationally demanding
aspects of the task.
No Output Produced: gh-repo-analytics.
All 8 verifier tests errored at the fixture stage with
“Missing /app/report.json,” meaning the agent never created the required output file. The task
requires interacting with a local Gitea server, cloning repositories, and computing analytics—a
multi-step pipeline where failure at any early stage prevents all downstream output.
Specification Violation: latex-formula-extraction.
The agent extracted LaTeX formulas
from a PDF but included markdown headers alongside the formulas in the output file, producing
6 entries instead of the required 5. The specification required one formula per line wrapped in $$
delimiters; the extraneous headers violated this format constraint. This failure illustrates agents’
tendency to over-include content rather than strictly adhering to output specifications.
Domain Knowledge Gap: exceltable-in-ppt.
The agent correctly updated the primary ex-
change rate cell in the PowerPoint-embedded Excel table (6/8 tests passed) but failed to recompute
inverse rates and dependent cells, producing NaN propagation through the spreadsheet. The underlying
issue was misunderstanding how Excel formula dependencies cascade in embedded workbooks—a
domain-specific detail that Skills could address.
Skills transforming outcomes: sales-pivot-analysis.
Without Skills, Codex populated
source data correctly but could not create Excel pivot tables (10/23 tests failed with “list index
out of range” on missing pivot objects). With Skills, the Skills provided Office-specific guidance
for programmatic pivot table creation that the agent could not discover independently. In the latest
aggregate, this task improves from 1.9% to 40.7% (+38.9 pp), illustrating how Skills can bridge a
specific capability gap.
J.3
