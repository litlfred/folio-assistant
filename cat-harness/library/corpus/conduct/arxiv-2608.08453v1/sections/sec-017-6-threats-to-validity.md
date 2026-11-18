---
doc_id: arxiv-2608.08453v1
doc_title: "What Keeps Agent Skills from Being Reusable? Evidence from 138K SKILL.md Files"
section_id: sec-017-6-threats-to-validity
section_title: "Threats to Validity"
section_number: 6
pages: 8-9
source_pdf: 2608.08453v1.pdf
source_sha256: dd50ffb3d44d7a3c
---
Construct validity. Our defect detectors use regex-based
heuristics, which may produce false positives or false nega-
tives. We mitigate implementation risk through mutation-
style fixture tests and threshold sensitivity analysis, but these
checks do not capture every semantic context in which a skill
may be used. The risk is highest for the two most context-
dependent categories. R5.3 (prompt injection) catches lexical
patterns that can appear legitimately inside security-auditing
or red-team skills that deliberately discuss injection prompts.
R7.1 (persona redefinition) catches second-person framing
What Keeps Agent Skills from Being Reusable? Evidence from 138K SKILL.md Files
Agent Skills ’26, May 26, 2026, San Jose, CA, USA
such as “you are a...” that is appropriate in skills designed
to teach an agent a specialized role. A stratified manual
precision audit of these safety-critical detectors is the most
important construct-validity check we did not run, and we
flag it as the first item of follow-up work; the headline 91.8%
number is robust to it because R5 and R7 contribute only a
small share of the all-category count, but per-category R5/R7
prevalence should be read as upper bounds. The 91.8% fig-
ure also bundles defects of very different severity—cosmetic
findings such as name-as-heading duplication (R2.4, 44.3%)
are counted alongside shipped credentials—so we addition-
ally report the Tier 1 89.3% number throughout and discuss
severity prioritization in Section 5 so that the headline is
not read as “92% of skills are broken.” Ambiguous credential-
handling or persona-based skills may still be misclassified,
and downstream task success may depend on context be-
yond static file structure. Treating the official specification
as the reference also means that legitimate deviations from
the recommended format (narrative-style skills, longer-than-
recommended bodies that remain actionable) can be labeled
as defects when they may work well in practice; the distinc-
tion between Tier 1 (spec) and Tier 2 (best practice) is partly
motivated by this asymmetry, and we recommend reading
defect counts as static-analysis findings rather than as direct
evidence of task-time failure.
Internal validity. Some detected “defects” may be inten-
tional design choices (e.g., persona redefinition for special-
ized skills). We separate spec violations from best-practice
recommendations and report prevalence rather than norma-
tive claims. The repair experiment uses GPT-4o-mini and a
sample of 200 skills; stronger models may perform differently,
and the per-category fix rates (notably the 0% for R5.2 bypass
and R5.3 injection) are based on small per-category subsam-
ples that we therefore use only to motivate the safety-gating
stage, not to argue precise repair-rate point estimates. Plat-
form and AI-marker analyses identify ecosystem patterns,
but the underlying authoring process is not directly observed.
The cross-platform comparison (Figure 3) further rests on
the 41.7% of skills that file paths allow us to attribute; the
remaining 58.3% land in generic skills/ paths and are ex-
cluded from per-platform statistics, so platform-level claims
should be read as conditional on the attributable subset.
External validity. Our dataset is limited to public GitHub
repositories and the agentskills.in registry; enterprise skills
may differ. The top 5 repositories contribute 23.5% of skills;
we report both aggregate and per-repository statistics. Plat-
form attribution via file paths is approximate because generic
skills/ paths (58.3%) cannot be attributed to a specific plat-
form.
Functional generalization beyond BM25 and beyond
R1. The routing stress test isolates the discovery stage of
reuse with a BM25 retriever (Section 3.4); production har-
nesses use LLM-based selection over the full description set,
so the absolute Hit@1 numbers should not be read as produc-
tion routing performance, and the gap between routing-clean
and routing-defective skills may compress under semantic
selection. We also do not run end-to-end task benchmarks for
R2–R7; their operational impact is supported only indirectly
through GitHub-issue corroboration, our repair experiment,
and prior work [4, 9, 11]. Extending the stress test with an
embedding reranker, an LLM selector, and a harness-level
benchmark over the remaining defect categories is a primary
direction we intend to pursue in follow-up work.
Reliability. The specification is evolving; rules grounded
in the current version may not apply to future revisions. We
document the spec version and detection logic for repro-
ducibility.
7
