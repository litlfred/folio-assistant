---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-029-the-taskmd-task-standard
section_title: "The task.md Task Standard"
section_number: null
pages: 18-19
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
We claim in §1 that the paired-evaluation protocol is reusable beyond our own task set: practitioners
can run the same harness on their own Skill libraries before shipping. That reuse requires the task
package to be portable and versioned. The task.md standard therefore packages a task as a single
schema-validated document—YAML frontmatter for configuration, Markdown body for the task
instruction—together with runtime directories named for their roles (verifier/, oracle/), so that
all 87 evaluated tasks load through one parser. Appendix B shows the package layout as instantiated
by SKILLSBENCH; this appendix specifies the standard itself.
Every pass rate reported in this paper comes from the deterministic test-script verifier described
below. The standard is strictly more expressive than SKILLSBENCH requires: it defines verifier
strategies the benchmark deliberately does not use (Table 4), so the format’s generality does not come
at the expense of the no-LLM-as-a-judge determinism on which the main measurement depends
(§3). The enforcement properties stated below hold in the open-sourced SKILLSBENCH reference
harness [BenchFlow team, 2026] and are covered by its test suite. Beyond the reference harness,
the standard is supported by the AgentBeats platform: tasks packaged as task.md run directly on
AgentBeats, where SKILLSBENCH is publicly available.1
1https://agentbeats.dev/Yiminnn/skillsbench-agentbeats
18
Although initially based on the Harbor task format [Harbor Framework Team, 2026], SKILLSBENCH
tasks required a new approach to support the self-generated Skills condition (Appendix D.6). This
condition relies on two isolated agent sessions (a creator and a clean solver), whereas Harbor only
supports single, continuous rollouts. To resolve this, we developed the task.md standard. This
format extends Harbor’s containerized framework by merging configuration and instruction files
