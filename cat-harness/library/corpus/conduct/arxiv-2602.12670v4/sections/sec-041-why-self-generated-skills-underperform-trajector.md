---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-041-why-self-generated-skills-underperform-trajector
section_title: "Why self-generated Skills underperform: trajectory audit"
section_number: null
pages: 23-23
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
We audited twelve solver trajectories across ten (task, configuration) pairs selected for extreme
condition gaps—tasks where curated Skills pass but self-generated fail, the rare cases where self-
generated beats no-Skills, and skill-dependent tasks—together with a protocol check comparing trials
of the same task. Four mechanisms account for the audited gap:
• Generated packs frequently go unused. In the pre-baked Codex and Gemini CLI family, 10 of
12 audited trajectories never list, read, or mention the generated skills—the event stream contains
zero occurrences of “skill”—so those passes and failures are causally unrelated to pack content.
Unlike curated Skills, which the harnesses surface through their native discovery mechanisms, a
pack the solver never discovers can only be dead weight.
• Authoring displaces task work. In the Claude Code realization the creator and solver scenes
share a single trial context. On threejs-to-obj, creator-side work consumed the trajectory
before a solver artifact was produced—trial logs end with the SKILL.md write still pending—even
though the creator had already produced and verified a correct OBJ export (written only to /tmp,
obeying “Do not solve the task directly”). Both baselines pass this task; the self-generated miss is
creator/solver interference, not knowledge failure.
• Consumed packs lock in confident errors. When the solver does use a generated pack, wrong as-
sumptions become load-bearing. On 3d-scan-calc, the generated SKILL.md asserts as a “critical
gotcha” that the STL coordinates are millimetres and hard-codes a 1000× unit conversion—both
solver trials ran the bundled script unquestioned and submitted a mass off by three orders of magni-
tude, with every other step correct. The curated Skill carries exactly the opposite warning (“Do
not assume millimeters . . . no unit conversion is needed”). On radar-vital-signs the generated
pack replaced the curated multi-check pipeline with a fire-and-forget script whose plausibility
bounds were too loose to flag its own implausible output, omitting the curated autocorrelation
cross-check.
• The clearest win is leakage, not reuse. The strongest positive case, fix-visual-stability
(self-generated 1.0 vs. curated 0.0 on Claude Code), works because the creator wrote the pack
inside the graded sandbox: the generated SKILL.md names the app’s exact offender components,
enumerates every data-testid the verifier checks, and prescribes a fix order—an answer key for
this instance rather than reusable procedure. The curated Skill ships only generic guidance plus
measurement tooling.
Two caveats temper per-task readings (the aggregate direction in Table 6 is unaffected). First, some
zeros are measurement artifacts: the 3d-scan-calc verifier was patched ten days after these runs
to also accept the millimetre interpretation, and unscored audit records are excluded from causal
interpretation. Second, the audit’s visibility is bounded: creator sessions for the pre-baked family are
not part of the released artifacts, and Gemini CLI trajectories omit tool outputs, so non-discovery
there is established behaviorally rather than from pack content.
D.7
