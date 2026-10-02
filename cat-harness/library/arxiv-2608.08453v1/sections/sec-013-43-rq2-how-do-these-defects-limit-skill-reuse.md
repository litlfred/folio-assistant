---
doc_id: arxiv-2608.08453v1
doc_title: "What Keeps Agent Skills from Being Reusable? Evidence from 138K SKILL.md Files"
section_id: sec-013-43-rq2-how-do-these-defects-limit-skill-reuse
section_title: "RQ2: How do these defects limit skill reuse?"
section_number: 4.3
pages: 4-5
source_pdf: 2608.08453v1.pdf
source_sha256: dd50ffb3d44d7a3c
---
Routing defects reduce discovery quality. Prevalence
alone does not show whether a defect matters operationally.
The most direct reuse failure is that an otherwise useful
skill is never selected. Because R1 is both prevalent and
tied to startup selection, we test this discovery-stage reuse
risk in Table 1. When queries are derived from repository
metadata, R1-clean skills achieve 88.5% hit@1 and 0.906 MRR,
compared with 82.6% hit@1 and 0.855 MRR for R1-defective
skills. The same direction holds under the stricter name/path-
only query proxy (26.7% vs. 24.3% hit@1).
What the stress test does and does not show. The stress
test isolates one stage of reuse—discovery from the startup
description surface—and one defect category, R1. We chose
R1 because it is the only category whose harms can be mea-
sured by a self-contained retrieval experiment over the ar-
tifact: a missing or non-functional description must reduce
discovery probability, and that effect can be quantified with-
out an external task harness. For R2–R3, the operational
impact is context cost and progressive-disclosure friction;
What Keeps Agent Skills from Being Reusable? Evidence from 138K SKILL.md Files
Agent Skills ’26, May 26, 2026, San Jose, CA, USA
Grounded in Official Agent Skills Spec
Reusability Defects in Agent Skills (7 categories, 31 checks)
Tier 1: Spec Conformance
Tier 2: Best Practice
R1. Routing
Metadata
(6 checks)
R2. Body
Content
(5 checks)
R3. Resource
Organization
(3 checks)
R4. Prohibited
Content
(4 checks)
R5. Behavioral
Safety
(6 checks)
R6. Portability
(4 checks)
R7. Persona &
Scope
(3 checks)
R1.1 Missing descrip-
tion
R1.2 Too short
(<30ch)
R1.3 Missing “when”
R1.4 Non-functional
R1.5 Too long
(>300ch)
R1.6 Routing misplace-
ment
R2.1 Exceeds 500 lines
R2.2 Non-actionable
body
R2.3 Explains obvious
R2.4 Name as heading
R2.5 Desc. dup. in
body
R3.1 Excessive inline
code
R3.2 Too many exam-
ples
R3.3 Monolithic (no
refs)
R4.1 Install instruc-
tions
R4.2 Changelog
R4.3 License text
R4.4 Unfinished mark-
ers
R5.1 Hardcoded creds
R5.2 Bypass safety
R5.3 Prompt injection
R5.4 Unguarded ac-
tions
R5.5 Suppress errors
R5.6 Leak user paths
R6.1 Hardcoded
model
R6.2 Platform path
R6.3 Platform tools
R6.4 OS-specific cmds
R7.1 Redefines per-
sona
R7.2 Overrides prior
instr.
R7.3 Scope mismatch
Figure 1. Two-tier defect taxonomy. Dashed box: Tier 1 (spec conformance). Tier 2: peer-reviewed literature and industry
standards.
0
20
40
60
80
Skills affected (%)
R1. Routing
R2. Body
R3. Resources
R4. Prohibited
R5. Safety
R7. Scope
R6. Portability
67.0%
51.4%
36.9%
16.7%
9.8%
6.7%
5.8%
Tier 1: Spec
Tier 2: Best Prac.
Figure 2. Defect prevalence by category. Tier 1 (red, solid):
spec conformance violations. Tier 2 (orange, hatched): best
practice violations.
for R4–R6, it is content pollution, execution safety, and porta-
bility; for R7, it is conflict with the host agent’s instruction
hierarchy. Each of these requires either an end-to-end agent
benchmark or a deployment harness to measure faithfully,
which is outside our scope here. We address the remaining
categories through three indirect lines of evidence in the
rest of the paper: GitHub-issue corroboration (Section 5), the
automated repair experiment for R5 (Section 5), and prior
task-success benchmarks that already report sensitivity to
body bloat and resource organization [4, 9].
Table 1. Routing stress test over 20,000 sampled skills. The
index contains frontmatter descriptions only.
Query
Group
𝑛
Hit@1
MRR
Metadata
R1-clean
6,514
88.5%
0.906
R1-defective
13,226
82.6%
0.855
Name/path
R1-clean
6,505
26.7%
0.347
R1-defective
13,331
24.3%
0.322
4.4
