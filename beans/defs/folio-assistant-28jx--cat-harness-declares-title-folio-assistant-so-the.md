---
# folio-assistant-28jx
title: cat-harness declares title folio-assistant, so the navbar labels it folio-assistant (cat-harness)
status: todo
type: bug
priority: normal
created_at: 2026-09-21T17:11:38Z
updated_at: 2026-09-21T17:11:38Z
---

Issue https://github.com/litlfred/folio-assistant/issues/756 item 8. cat-harness/cat-harness.json has name cat-harness and title folio-assistant; disambiguate() in scripts/harness-tiles.ts:462 is correct, the declaration is not.
