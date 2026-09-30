---
# folio-assistant-a0s3
title: 'B8 (#1168): string-to-reference sweep — typed refs on ~25 bare-string fields; delete SkillDefinition.roles and front-matter package:'
status: completed
type: task
priority: normal
created_at: 2026-09-23T21:12:05Z
updated_at: 2026-09-30T10:42:13Z
parent: folio-assistant-tr05
---

Mechanical sweep from the string-to-reference analysis (#1168 comment 5803006038). SkillNameSchema / ProcessIdSchema / TaskRefSchema / BeanIdSchema / BLOCK_KINDS enum / ThemeRefSchema / KgRefSchema on the listed fields; kg-export ActorDef.roles and role toJsonLd skills as @id links; resolve memory roles/agents. Delete SkillDefinition.roles (inverse of RoleDef.skills, 0 instances) and skill front-matter package: (unread duplicate). Design questions 1-9 are on #1168, not in scope.

## Done when
- every listed field uses its typed helper and a check resolves it
- kg-export emits links, not literals, for actor roles and role skills
- SkillDefinition.roles and front-matter package: are gone



## Owner decisions, 2026-09-30 (the four B8 blockers)
1. Skill refs: accept `name` and `package/name`; a check resolves each and fails on an ambiguous bare name.
2. Process identity: the BPMN element id; typed element-id helper checked against loaded diagrams.
3. Themes: migrate the 18 string values to ThemeRef {instance?, themeId}.
4. Voice appliesTo: union of block kinds and declared artefact kinds.



## Done — #1525 (B8a), #1536 (B8b-1), #1550 (B8b-2/3, B8c), #1572 (B8d)
Every listed field uses its typed helper and a check or test resolves it; kg-export emits mayTakeRole links for actor roles (role→skill was already hasSkill); SkillDefinition.roles and front-matter package: are retired. Design questions 1-9 on #1168 remain for the owner.
