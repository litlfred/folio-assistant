---
doc_id: arxiv-2608.08453v1
doc_title: "What Keeps Agent Skills from Being Reusable? Evidence from 138K SKILL.md Files"
section_id: sec-014-44-rq3-which-platform-and-provenance-signals-are
section_title: "RQ3: Which platform and provenance signals are associated with reusable skill quality?"
section_number: 4.4
pages: 5-7
source_pdf: 2608.08453v1.pdf
source_sha256: dd50ffb3d44d7a3c
---
associated with reusable skill quality?
Cross-platform quality. If defects reflect only individual
author mistakes, platform-level patterns should be weak. In-
stead, the data suggest that platform conventions and prove-
nance signals travel with different skill-quality profiles. Fig-
ure 3 reveals statistically significant quality variation across
platforms (Kruskal–Wallis 𝐻= 594.17, 𝑝< 10−125). Cursor
skills are highest quality (avg 1.55 defects, 13.5% defect-free),
while OpenClaw marketplace skills are lowest (avg 2.29,
3.1% defect-free). Cursor differs significantly from Generic,
OpenClaw, and Claude Code (Bonferroni-corrected Mann–
Whitney tests, all 𝑝adj < 10−34). Three factors correlate with
platform-level quality: specification awareness (spec-aware
skills average 1.83 defects vs. 3.00 for spec-unaware, Cliff’s
𝛿= −0.40), AI-generation rate, and curation model.
AI-marked skills differ from unmarked skills. Fig-
ure 4 compares defect rates between the 19,857 skills with
explicit AI-generation markers and the remaining 118,276
unmarked skills. We emphasize that this is an association
between an observable marker and observed defect rates,
not a causal claim about AI vs. human authorship. The AI-
marked subset is not a random sample of AI-generated skills:
Agent Skills ’26, May 26, 2026, San Jose, CA, USA
Chi Zhang, Yimin Liu, Xinze Chen, and Ping Ji
Cursor
Codex
Claude
Code
Gemini
CLI
OpenClaw
0.0
0.5
1.0
1.5
2.0
2.5
3.0
3.5
Avg defects
1.55
1.71
2.04
2.04
2.29
Avg defects
Spec-aware %
0
20
40
60
80
Spec-aware (%)
60%
43%
46%
37%
43%
Figure 3. Cross-platform quality: average defects (red) vs.
specification awareness (blue).
only some generators or authors self-disclose, sloppier au-
thors may be more likely to ship the boilerplate marker,
and some platforms auto-stamp markers, all of which can
produce a confounded comparison. AI-marked skills aver-
age 3.23 detected defects versus 2.34 for unmarked skills,
a 38.0% increase (Mann–Whitney 𝑈, 𝑝< 10−300; Cliff’s
𝛿= +0.28, small effect), and are defect-free at half the rate
(5.0% vs. 8.8%). The gap is sharpest for safety-critical cat-
egories: 18.9% of AI-marked skills have behavioral safety
defects (R5), compared to 8.2% of unmarked skills (2.3×;
𝜒2 = 2,209, 𝑝< 10−300, 𝜙= 0.13). Portability defects (R6)
show a similar pattern (12.8% vs. 4.6%, 2.8×), consistent with
generated or conversation-derived skills inheriting platform-
specific paths and model references. We read this pattern as a
signal that the explicit-marker subset warrants closer review
at generation time, not as evidence that AI-authored skills
are intrinsically worse; a propensity-matched analysis on
length, platform, and repository popularity is left to future
work.
Two additional correlates reinforce this pattern. Defect
density increases with skill size (Spearman’s 𝜌= 0.508, 𝑝<
10−300): skills over 500 lines average 4.76 defects, compared
with 1.48 for skills under 50 lines. Defects also cluster across
categories: only 33.0% of defective skills are confined to one
category, and safety defects co-occur with portability defects
at 2.19× the rate expected by chance.
4.5
RQ4: What traits characterize reusable,
high-quality Agent Skills?
The previous results identify failure modes. We next ask
what public skills look like when those failure modes are ab-
sent. We identified 2,406 skills from repositories with ≥10,000
GitHub stars and analyzed the 419 with zero detected defects.
Routing
Body
Resource
Prohib.
Safety
Portab.
Scope
0
20
40
60
80
Skills affected (%)
74
58
44
23
19
13
6
Non-AI (n=118,276)
AI-marked (n=19,857)
Figure 4. Defect rates by category: AI-marked skills (red)
vs. unmarked skills (blue). AI-marked skills show higher
detected defect rates across all categories, with the largest
gaps in Safety (2.3×) and Portability (2.8×).
We use these skills as exemplars for qualitative characteriza-
tion, not as proof that zero detected defects are necessary or
sufficient for task success.
These exemplary skills exhibit two distinct styles: Minimal-
and-precise: React’s verify skill (24 lines) contains only
imperative commands and common mistakes. Structured-
workflow: Discourse’s service-authoring skill (220 lines) de-
fines an eight-phase workflow with gate conditions and audit
checklists; every line is actionable.
Five shared traits characterize these exemplary skills:
1. Trigger-complete descriptions (G1): every exemplary
skill includes “Use when ...”
2. No name-as-heading (G4): none duplicate their name
as an H1 heading.
3. Imperative throughout (G5): body text consists of di-
rectives, not explanations.
4. Project-specific knowledge: skills encode local conven-
tions, not generic programming concepts.
5. No prohibited content (G8): no install instructions, changel-
ogs, or license text.
We note that traits 1, 2, 3, and 5 are partly definitional
under our detectors: a skill with zero detected defects nec-
essarily passes G1, G4, G5, and G8 because those guidelines
correspond to the very detectors we use to select the sub-
set. The genuinely non-tautological observation is trait 4
(project-specific knowledge), which we identified by man-
ual reading of the 419 exemplars: across both the minimal
and structured-workflow styles, exemplars consistently en-
code local procedural knowledge (specific to a repository,
framework, or service) rather than reproducing tutorial con-
tent that an LLM could already generate on demand. We
What Keeps Agent Skills from Being Reusable? Evidence from 138K SKILL.md Files
Agent Skills ’26, May 26, 2026, San Jose, CA, USA
treat this as a qualitative observation worth following up
with an operationalized measure (e.g., embedding distance
to LLM-generated baselines for the same description) rather
than as a quantified finding. The common pattern is not
merely absence of lint findings: these skills encode local,
actionable procedures with clear activation conditions and
little reusable-context waste. This characterization motivates
the guideline table below, which combines official structural
requirements with empirical and safety-derived constraints.
4.6
