---
# folio-assistant-oe8l
title: 'Skill: establish placement before creating a skill, role, task or schema'
status: in-progress
type: task
priority: normal
created_at: 2026-09-19T10:10:54Z
updated_at: 2026-09-19T10:10:57Z
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
