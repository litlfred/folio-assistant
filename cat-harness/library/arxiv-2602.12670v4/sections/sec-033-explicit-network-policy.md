---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-033-explicit-network-policy
section_title: "Explicit Network Policy"
section_number: null
pages: 19-20
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
Because uncontrolled network egress is a confound for a deterministic verifier, the standard makes
egress explicit: access is declared with a single enumerated field, network_mode ∈{no-network,
public, allowlist}, rather than a coarse on/off boolean. The allowlist mode requires a non-
empty allowed_hosts list—a parse-time error otherwise—so an allowlist declaration is never
left under-specified. A task whose data is baked into the container image declares no-network; a
task that must reach a fixed external service declares allowlist with the specific hosts.
C.4
Verifier Strategies
A verifier strategy is selected by a type field, either in the verifier block of task.md or in an
optional verifier/verifier.md manifest, where the same strategy is spelled script rather than
test-script (Table 4). Absent a manifest, the configuration’s verifier.type selects the default
test-script path, which runs verifier/test.sh and reads a pass/fail result from reward.txt
19
(or a structured reward.json); test-script is the only strategy the 87 tasks use, which keeps
the measurement free of LLM-as-a-judge variance (§3). The remaining strategies—llm-judge,
reward-kit, and agent-judge / ors-episode—exist for task classes whose correctness a deter-
ministic script cannot decide; they are part of the standard but not of this benchmark. Unscored,
stale, or rate-limited rows are treated as incomplete coverage; timeout rows enter only when healthy
replacements are unavailable and are scored as failures.
Table 4: Verifier strategies defined by the task.md standard. SKILLSBENCH uses test-script
exclusively to preserve deterministic, programmatic verification.
Strategy
Reward source
In SKILLSBENCH
test-script
test.sh →reward.txt/json
all 87 tasks
llm-judge
rubric-scored deliverables
not used
reward-kit
external reward entrypoint
not used
agent-judge
judged transcript
not used
ors-episode
episode evidence →reward
not used
D
