---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-063-outcome-and-runtime-diagnostics
section_title: "Outcome and Runtime Diagnostics"
section_number: null
pages: 34-35
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
Table 16: Trial-level outcome distribution in the latest 18-configuration aggregate (N = 9,396
selected public trials), overall and by Skills condition. Attempted = a verifier-scored trial with reward
0; Runtime err. = no scored result (agent/harness/verifier error), counted as reward 0 in the main
aggregate.
Condition
n
Solved
Partial
Attempted
Runtime err.
No Skills
4,698
31.3%
5.4%
62.7%
0.6%
Curated Skills
4,698
47.7%
4.7%
46.5%
1.0%
Overall
9,396
39.5%
5.1%
54.6%
0.8%
34
Table 17: Runtime errors in the latest 18-configuration aggregate (trials with no scored result; 78 of
9,396 = 0.8%). Classified from the recorded error/error_category fields.
Error class
Count
Source
Command timeout
72
Shell command exceeded its per-command limit
Agent-process crash
0
ACP internal/transport error
Agent timeout (wall-clock/idle)
5
Agent exceeded its wall-clock or idle budget
Subprocess crash
0
Local subprocess/transport closed unexpectedly
Verifier error
1
Verifier crash or timeout
Total
78
0.8% of selected public trials
L.3
