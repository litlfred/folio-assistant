---
# folio-assistant-zj6c
title: who-iris is a harness but has no who-iris.config.json, so it reads as a dependency
status: todo
type: bug
priority: high
created_at: 2026-09-21T17:28:40Z
updated_at: 2026-09-21T17:31:42Z
parent: folio-assistant-yj32
---

Owner, 2026-09-21: "who-iris is supposed to be a harness becuase it serves up a new landing page (the iris home page), and has its own docs. it should have who-iris.config.json"

CORPUS CHECK, from the generated docs/_data/harness.json. who-iris is 'instantiated: false' but ALREADY resolves 'href: /who-iris/' with hrefKind 'folio' — it has its own docs/, so the tile would open its own themed root the moment it is instantiated. The only missing artefact is 'who-iris.config.json' at the REPOSITORY ROOT. harness-tiles: '<name>.config.json at the instantiation root says the instance is instantiated HERE.'

SECOND INSTANCE OF THE SAME DEFECT, found while checking: folio-assistant-sci carries its config at 'folio-assistant-sci/folio-assistant-sci.config.json' — inside its own directory rather than at the root — so it also reads as not instantiated. Whether that is a misplaced file or a second legitimate location is a question for the owner, and fixing one without the other would leave the rule stated in two ways.
