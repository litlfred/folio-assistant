---
# folio-assistant-iwtn
title: 'BOOTSTRAP SELF-DEFINITIONAL: ~130 mentions of harnesses above bootstrap across 16 files (bpmn, skills, bootstrap.json)'
status: todo
type: task
created_at: 2026-09-23T19:19:45Z
updated_at: 2026-09-23T19:19:45Z
parent: folio-assistant-88mg
---

Owner, 2026-09-23: *"bootstrap = self definitional. no semantic leakage, no graph leakage."* The README, AGENTS.md and the new `schemas/graph.schema.json` now comply (pv51, with a test in `bootstrap-tools/schemas/graph.test.ts`). The rest of `bootstrap/` does not.

**Measured 2026-09-23:** mentions of WHO, DAK, smart-guidelines, smart-base, cat-harness, folio or f-a-sci, or a `../` path, per file:

| file | count |
|---|---|
| bootstrap.json (mostly `_comment` fields) | 32 |
| processes/initialize-harness.bpmn | 24 |
| processes/discussion.bpmn | 13 |
| scenarios/roles.json | 9 |
| skills/bootstrap-graph-emission.md | 8 |
| skills/discussion.md | 7 |
| processes/log-message.bpmn | 7 |
| schemas/discussion.output.schema.json (generated, from its Zod) | 6 |
| skills/confirm-harness.md, skills/bootstrap-kg-navigation.md | 4 each |
| skills/root-readme.md, log-message.md, bootstrap-graph-publication.md, discussion.input.schema.json | 3 each |

About 130 in all. Each is either an example naming a Harness above bootstrap (replace it with `<name>`), a link or path above bootstrap (remove it), or design history (move it to the bean it came from).

## Done when
- [ ] no file in `bootstrap/` names anything above it, except the published `$id` host
- [ ] the leak test in `bootstrap-tools/schemas/graph.test.ts` covers every file in `bootstrap/`, not only the README
- [ ] the `.pot` translation templates are re-extracted after the `.bpmn` edits
