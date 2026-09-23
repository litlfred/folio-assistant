---
# folio-assistant-a0s3
title: 'B8 (#1168): string-to-reference sweep — typed refs on ~25 bare-string fields; delete SkillDefinition.roles and front-matter package:'
status: todo
type: task
created_at: 2026-09-23T21:12:05Z
updated_at: 2026-09-23T21:12:05Z
parent: folio-assistant-tr05
---

Mechanical sweep from the string-to-reference analysis (#1168 comment 5803006038). SkillNameSchema / ProcessIdSchema / TaskRefSchema / BeanIdSchema / BLOCK_KINDS enum / ThemeRefSchema / KgRefSchema on the listed fields; kg-export ActorDef.roles and role toJsonLd skills as @id links; resolve memory roles/agents. Delete SkillDefinition.roles (inverse of RoleDef.skills, 0 instances) and skill front-matter package: (unread duplicate). Design questions 1-9 are on #1168, not in scope.

## Done when
- every listed field uses its typed helper and a check resolves it
- kg-export emits links, not literals, for actor roles and role skills
- SkillDefinition.roles and front-matter package: are gone
