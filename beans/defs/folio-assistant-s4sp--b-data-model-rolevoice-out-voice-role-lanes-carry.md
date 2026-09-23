---
# folio-assistant-s4sp
title: 'B: data model — Role.voice out, Voice->Role, lanes carry role ref, typed refs, skill input/output schema refs, test conformance'
status: todo
type: task
created_at: 2026-09-23T19:53:34Z
updated_at: 2026-09-23T19:53:34Z
parent: folio-assistant-tr05
---

See #1168 plan B. Migrates cat-harness roles and voices; changes audit criteria role-declares-voice and role-has-use-cases.

Owner, 2026-09-23: "you'll need to fix tools". Tools are in scope for B: a Tool's io ports reference the skill's input/output schemas (typed KG refs, not t("Text")), and check-tools checks port TYPES against the skill contract, not only names (today contractRequires compares required property names only).
