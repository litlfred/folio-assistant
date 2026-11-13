---
doc_id: arxiv-2608.08453v1
doc_title: "What Keeps Agent Skills from Being Reusable? Evidence from 138K SKILL.md Files"
section_id: sec-016-5-discussion
section_title: "Discussion"
section_number: 5
pages: 7-8
source_pdf: 2608.08453v1.pdf
source_sha256: dd50ffb3d44d7a3c
---
The conversation-first provenance hypothesis. Why
are detected defect rates so high despite a clear specifica-
tion? A reusable skill is not merely a saved prompt; it is a
routed, progressively disclosed, executable capability. We
propose—and label explicitly as a hypothesis rather than a
measured finding—that many public skills are instead ex-
tracted from problem-solving conversations: a developer
solves a task interactively, then saves the conversation as
SKILL.md. This would explain the recurring co-occurrence
of routing metadata weakness, name-as-heading duplica-
tion, install instructions, hardcoded paths, model names, and
safety bypasses, which together resemble what a chat tran-
script looks like when serialized to disk. The platform and
AI-marker associations are consistent with this hypothesis
but do not establish it: the exact authoring path of each pub-
lic skill is not observable from the file alone, and we did
not measure text overlap with chat transcripts or look for
explicit “saved from chat” markers, both of which would be
required to test the hypothesis directly. We surface it here
because it offers a single mechanism that ties together the
observed defect cluster and motivates the generation-time
interventions in the workflow below; we leave its empirical
evaluation to future work.
Specification compliance is necessary but not suffi-
cient. Anthropic’s official structure provides the minimal
contract for reuse: frontmatter descriptions make skills routable,
body-size guidance limits context cost, and resource direc-
tories enable progressive disclosure. Our data supports this
guidance: spec-aware skills average fewer detected defects,
and R1-clean skills perform better in the routing stress test.
At the same time, a syntactically valid skill can still be generic,
stale, unsafe, or tied to a local environment; conversely, a
cosmetic defect such as repeating the name as an H1 heading
is less serious than shipping a live API key. This distinction
motivates our taxonomy: official-spec conformance (R1–R3)
is separated from best-practice and operational risks (R4–
R7), and our workflow combines spec-aware prompting with
linting, repair, and safety gates rather than treating official
formatting as sufficient.
Real-world impact: evidence from GitHub issues. Our
issue analysis classified 303 of 761 relevant issues into our
R1–R7 taxonomy. Routing defects (R1) are both the most
prevalent (67.0%) and most reported (69 issues), followed by
body/content issues (75), safety issues (62 plus 108 security-
scan disputes), and scope/persona issues (12). Notable ex-
amples include skills that never activate despite matching
descriptions, 28 plugin skills totaling 34K tokens causing
4+ minute cold starts, and published skills shipping live
API keys. Of 108 security-scan false-positive appeals on
ClawHub, 63 (58.3%) were triggered by credential-related
patterns in legitimate security-auditing skills, confirming
that keyword-based scanners cannot distinguish skills that
handle credentials from those that leak them.
Prioritizing defects. Defect-free status is not the goal.
Critical defects are routing failures (R1.1–R1.4) and safety
violations (R5), because they prevent activation or create
vulnerabilities. Important defects such as body bloat and
monolithic structure waste context and hinder maintenance.
Cosmetic defects such as name-as-heading duplication waste
tokens but may not break execution. For practitioners, the
priority is eliminating high-impact defects, especially hard-
coded credentials, safety bypasses, unguarded destructive
actions, and user path leakage.
Progressive enforcement: quantifying the return on
investment. We simulated 12 cumulative linter configura-
tions by adding guidelines in order of marginal defect cov-
erage. Figure 5 shows a clear elbow at three guidelines: G1
catches 33.4% of observed defect instances, and adding G4
and G7 raises coverage to 71.9% while flagging 85.9% of skills.
The full suite covers 99.4% of observed defect instances, while
adding G9 and G10 raises critical-defect coverage (routing +
safety) from 74.7% to 98.6%.
A quality-assured generation workflow. Because self-
generated skills provide no average benefit in SkillsBench [9],
generation workflows need explicit quality gates. Our find-
ings motivate four stages that correspond to the reuse life-
cycle: write routable skills, catch cheap structural defects,
repair fixable content, and block unsafe deployment.
Stage 1: Spec-aware prompting. Specification aware-
ness is the strongest quality correlate we identified (Cliff’s
𝛿= −0.40, medium effect): skills whose descriptions follow
the “[Verb] [what]. Use when [trigger]” pattern average 1.83
detected defects vs. 3.00 for spec-unaware skills. Generation
prompts should include routing requirements (G1–G3), struc-
tural constraints (G4–G7), and content prohibitions (G8).
Stage 2: Lightweight linting. Even spec-aware genera-
tion will not eliminate all defects. The three-rule linter (G1,
Agent Skills ’26, May 26, 2026, San Jose, CA, USA
Chi Zhang, Yimin Liu, Xinze Chen, and Ping Ji
Table 2. Evidence-based skill authoring guidelines, ordered by impact.
Phase
Guideline
Target Defects
Affected
1.
Description
G1. Write ≥30 characters: “[Verb] [what]. Use
when [trigger].”
R1.2, R1.3, R1.4
52.3%
G2. Place routing info in description, not body.
R1.6
5.2%
G3. Keep under 250 characters; front-load the use
case.
R1.5
14.3%
2. Body
G4. Do not repeat name as H1 heading.
R2.4
44.3%
G5. Write imperative directives, not explanatory
prose.
R2.2, R2.3
3.2%
G6. Keep body under 500 lines.
R2.1
10.4%
3. Resources
G7. Externalize code (>60%) and examples (>8
blocks).
R3.1–R3.3
37.0%
4. Content
G8. Remove install instructions, changelogs, li-
censes, TODOs.
R4.1–R4.4
16.8%
5. Safety
G9. Remove credentials, user paths, –no-verify
flags.
R5.1, R5.2, R5.6
5.8%
G10. Require confirmation for destructive ac-
tions.
R5.4, R5.5
4.7%
6.
Portabil-
ity
G11. No hardcoded models, platform paths, or
OS commands.
R6.1–R6.4
5.8%
7. Identity
G12. Do not redefine agent persona or override
prior instructions.
R7.1–R7.3
6.8%
G1
G4
G7
G8
G3
G6
G9
G5
G2
G10
G11
G12
Cumulative guidelines enforced
0
20
40
60
80
100
Defects eliminated (%)
Minimal viable
linter (G1+G4+G7)
All defects eliminated (%)
Critical defects eliminated (%)
Skills blocked (%)
0
20
40
60
80
100
Skills blocked (%)
Progressive Enforcement: Defect Elimination Curve
Figure 5. Progressive enforcement: cumulative coverage of
observed defect instances as guidelines are added in order of
marginal defect coverage (not in the phase-ordered sequence
used in Table 2). The elbow at G1+G4+G7 marks the three-
rule lightweight linter.
G4, G7) acts as a fast deterministic gate before repair or
deployment.
Stage 3: Automated repair. Skills that fail linting en-
ter an LLM-based repair loop. Our repair experiment on
200 defective skills shows that providing the LLM with the
detected defect list and relevant guidelines fixes 58.4% of
detected defects while introducing only 0.06 new detected
defects per skill. Structural defects are repaired reliably, but
content-reduction defects remain difficult; heavily defective
skills should be regenerated rather than repaired.
Stage 4: Safety gating. In our repair experiment, some
safety defects (R5: hardcoded credentials, safety bypasses,
prompt injection, unguarded destructive commands) were
not repaired reliably, with 0% fix rate for bypass and injec-
tion defects. For that reason, safety checks should be non-
bypassable gates after repair and before deployment, with
R5 subcategories guiding context-aware review beyond key-
word matching.
6
