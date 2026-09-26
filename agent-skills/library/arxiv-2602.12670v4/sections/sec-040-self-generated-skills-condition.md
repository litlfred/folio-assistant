---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-040-self-generated-skills-condition
section_title: "Self-Generated Skills Condition"
section_number: null
pages: 21-23
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
The self-generated condition asks whether an agent can replace curated Skills with Skills it authors
for itself. Unlike the no-Skills and curated-Skills conditions, it consists of two isolated sessions per
21
task. In the creator session, a clean agent receives the task package with all curated Skills removed
and exactly one Skill mounted—Anthropic’s official skill-creator—and is instructed to author
skill packs rather than solve the task. The creator prompt, verbatim from the harness:2
Use the skill-creator skill exactly as provided.
Read /instruction.md and inspect the task environment only as
needed to understand the reusable workflow.
Do not solve the task
directly.
Create one or more complete Anthropic-standard skill packs as
immediate child directories under:
/app/generated-skills
Use this suggested path if one skill is enough:
/app/generated-skills/<task>-skill
Each generated skill pack path must look like
/app/generated-skills/<skill-name>/SKILL.md.
It may include
scripts/, references/, assets/, examples, or other bundled resources
when they help a fresh solver avoid repeated work.
The solver context will start with a clean agent session and only
the generated skill packs mounted.
Make the skills useful for
solving this task type from the same sandbox environment.
In the solver session, a fresh agent then runs the task exactly as in the curated-Skills condition, except
that the curated Skills are replaced by the generated packs; the task instruction itself is unmodified,
and none of the creator’s reasoning is in the solver’s context. The campaign realized this protocol
in two ways: the Claude Code runs execute the creator and solver scenes back-to-back inside each
trial’s sandbox, regenerating the packs every trial, whereas the Codex and Gemini CLI runs generated
the packs once per (task, configuration) and reused them across the scored solver trials. Because the
Claude Code scenes share the task sandbox, file-system state can carry over beyond the pack files;
the consequences of both realizations are examined in Appendix D.6.1.
Configurations and accounting.
The condition is evaluated on the three dedicated-harness con-
figurations of the main aggregate—Claude Code with Opus 4.7, Codex with GPT-5.5, and Gemini
CLI with Gemini 3.1 Pro—using the same harness, model identifier, and sandbox as their baselines.3
The self-generated condition is retained as a diagnostic rather than part of the main two-condition
aggregate. The current audit reports verifier-scored trials against the same 87-task, three-trial frame:
258, 258, and 253 of the 261 slots are present for the three configurations respectively (the campaign
skipped pddl-airport-planning); unscored or missing slots are treated as coverage gaps rather
than accepted outcomes. The no-Skills and curated-Skills columns restate the main aggregate of
Table 2.
Table 6: Self-generated Skills vs. the matched baselines on the three dedicated-harness configurations
(pass rate %, fixed 87-task denominator). ∆G = self-generated minus no Skills; ∆S = curated Skills
minus no Skills.
Harness
Model
No Sk.
Self-Gen
∆G
Curated
∆S
Claude Code
Opus 4.7
43.0
34.9
–8.1
61.2
+18.2
Codex
GPT-5.5
46.8
35.5
–11.3
66.5
+19.7
Gemini CLI
Gemini 3.1 Pro
36.0
24.5
–11.5
60.8
+24.8
On all three configurations, self-generated Skills land below the no-Skills baseline (−8.1 to −11.5 pp)
while curated Skills add +18.2 to +24.8 pp (Table 6, Figure 10). The trajectory audit below shows
the deficit is not a single mechanism: generated packs frequently go unused by the solver, creator-
side authoring can displace solver progress, and packs that are used can lock in confidently wrong
assumptions.
2/instruction.md is the in-sandbox mount of the task instruction (the task.md body); <task> denotes the task name.
3One deviation: the Claude Code self-generated runs used effort level max, whereas its baseline runs used high; the Codex
(xhigh) and Gemini CLI configurations match their baselines exactly.
22
Opus 4.7
(Claude Code)
GPT-5.5
(Codex)
Gemini 3.1 Pro
(Gemini CLI)
0
20
40
60
80
100
Pass Rate (%)
43.0
46.8
36.0
34.9
35.5
24.5
61.2
66.5
60.8
No Skills
Self-Generated
Curated Skills
Claude
Codex
Gemini
Figure 10: Self-generated Skills underperform not only curated Skills but the no-Skills baseline on
all three dedicated-harness configurations.
D.6.1
