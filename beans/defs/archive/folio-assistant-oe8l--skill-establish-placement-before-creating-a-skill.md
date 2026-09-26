---
# folio-assistant-oe8l
title: 'Skill: establish placement before creating a skill, role, task or schema'
status: completed
type: task
priority: normal
created_at: 2026-09-19T10:10:54Z
updated_at: 2026-09-19T10:27:34Z
---


## Why

`AGENTS.md` leads with the defect: *"folio-assistant is the platform, not the
content… If you are about to write subject matter here, you are either in the
wrong repo or writing something that belongs in the folio as data."* It is
phrased as a warning because it keeps happening — `scripts/generate-readme.sh`
held one folio's title, badges, knot registry and simulator path inside the
platform, and would have destroyed any other folio's README. The whole
§"README sections" section of `AGENTS.md` is that post-mortem.

There is a subagent for it (`platform-boundary-guard`) but no skill, so the
knowledge reaches one agent's system prompt and nobody else. A human, a
sibling session, or a `workflow_next` handing over an activity cannot get it.

## Done when

`skills/folio-core/placement.md` exists and is registered, under 280 lines
(`skill-is-brief`), covering: which instance (declaration over path, override
by `id`, the `resolveSkillDirs` no-caller gap), which KIND (adapter vs
profile, actor/role/skill/permission), BOTH senses of "stub" (the `AGENTS.md`
pointer stub and the `artefactStub()` artefact stub), and the
could-not-determine third state routed into `interaction-modality` §4.1.
Bound to a role so the process model reaches it, and
`platform-boundary-guard`'s memory pointing at it rather than restating it.

_2026-09-19T10:19:34Z_ — Skill written: skills/folio-core/placement.md, 277 lines, PR #392. Four-step procedure (instance / declared graph / node kind / stub) plus a stop. Both senses of stub covered. Bound to authoring-agent and code-reviewer. Owner also decided in-flight to widen code-reviewer to [person, agent], carried in the same PR because both edits regenerate the same 30 role sidecars. Gates green: bun test 2344/0, eslint, tsc, playwright 140, kg:audit:check exit 0 with actor-kind-fits-role at zero. Outstanding: platform-boundary-guard's memory nodes still restate rather than point at the skill - blocked on its 200-line injection budget, bean 4kiw.

_2026-09-19T10:27:31Z_ — Closing: skills/folio-core/placement.md landed in PR #392 (merged 1082f3cfe). 277 lines, under the 280-line skill-is-brief threshold; registered and bound to roles authoring-agent and code-reviewer, so workflow_next reaches it. Four-step procedure — which instance, which declared graph, which node kind, which stub — with both senses of 'stub' distinguished and the could-not-determine third state routed into interaction-modality 4.1. The one Done-when clause NOT met is the last: platform-boundary-guard's memory nodes still restate the placement rules instead of pointing at the skill. That is not deferred vagueness — it is blocked on a measured constraint, the agent's MEMORY.md sitting at exactly its 200-line injection budget, and it is tracked as bean 4kiw with the measurement. Closing here rather than holding oe8l open on another bean's blocker.
