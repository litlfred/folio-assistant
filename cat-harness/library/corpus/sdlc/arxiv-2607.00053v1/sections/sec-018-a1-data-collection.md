---
doc_id: arxiv-2607.00053v1
doc_title: "SWE-Router: Routing in Multi-turn Agentic Software Engineering Tasks"
section_id: sec-018-a1-data-collection
section_title: "Data Collection"
section_number: A.1
pages: 8-8
source_pdf: arxiv-2607.00053v1.pdf
source_sha256: f55db25135d0d28c
toc_source: inferred
---
Training value functions requires labeled trajectory data from weaker LLMs;
since SWE-smith only ships
claude-3.7-sonnet trajectories (Yang et al., 2025), we generate our own and release them. Table 1 summarizes the
collected splits.
SWE-Smith instances. We sub-sample SWE-smith into three repository-disjoint partitions: train (∼1.7k trajectories
per weak LLM), val (∼210, used for threshold tuning), and test (∼170–346, drawn from yet another repository set).
Resolved/unresolved labels come from running the SWE-smith unit tests against the agent’s submitted patch.
SWE-Bench instances. For cross-distribution evaluation we collect trajectories on SWE-bench Verified (500 issues, all four
LLMs). Under mix-1 (Section A.2), 4/5 of these instances enter training, so the genuinely held-out slice consists of 100
instances.
