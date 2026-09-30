---
# folio-assistant-s4sp
title: 'B: data model — Role.voice out, Voice->Role, lanes carry role ref, typed refs, skill input/output schema refs, test conformance'
status: completed
type: task
priority: normal
created_at: 2026-09-23T19:53:34Z
updated_at: 2026-09-30T19:38:35Z
parent: folio-assistant-tr05
---

See #1168 plan B. Migrates cat-harness roles and voices; changes audit criteria role-declares-voice and role-has-use-cases.

Owner, 2026-09-23: "you'll need to fix tools". Tools are in scope for B: a Tool's io ports reference the skill's input/output schemas (typed KG refs, not t("Text")), and check-tools checks port TYPES against the skill contract, not only names (today contractRequires compares required property names only).

## Owner decisions, 2026-09-23
- Split B into four PRs: B1 lanes carry the role (Role.lanes out); B2 Voice->Role (the 35 role `voice` sentences MOVE into one-rule voice profiles with activeIn.roles), stories->Role (useCases out), typed skills, audit criteria; B3 skill input/output contracts + Tools checked by type; B4 test runs checked against the contract.
- "mcp services should not be in bootstrap, its a Tool in cat-harness that references things in bootstrap": B3 also removes Skill.mcpServices (8 skills use it) — each MCP service becomes a cat-harness Tool that `satisfies` the skill. Same shape to review in B3: Skill.scripts and Skill.validators.

## Done when
- [ ] B1 merged
- [ ] B2 merged
- [ ] B3 merged
- [ ] B4 merged

## Closed on evidence (2026-09-30)
All four sub-PRs are on main: B1 (ae7316bd24c merge), B2 (9696f788841), B3 (9daa52cecaf B3a, c9e1e76602d B3b), B4 (6431bbd9438).
