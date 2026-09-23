---
# folio-assistant-zj6c
title: who-iris is a harness but has no who-iris.config.json, so it reads as a dependency
status: completed
type: bug
priority: high
created_at: 2026-09-21T17:28:40Z
updated_at: 2026-09-21T22:08:02Z
parent: folio-assistant-yj32
---

Owner, 2026-09-21: "who-iris is supposed to be a harness becuase it serves up a new landing page (the iris home page), and has its own docs. it should have who-iris.config.json"

CORPUS CHECK, from the generated docs/_data/harness.json. who-iris is 'instantiated: false' but ALREADY resolves 'href: /who-iris/' with hrefKind 'folio' — it has its own docs/, so the tile would open its own themed root the moment it is instantiated. The only missing artefact is 'who-iris.config.json' at the REPOSITORY ROOT. harness-tiles: '<name>.config.json at the instantiation root says the instance is instantiated HERE.'

SECOND INSTANCE OF THE SAME DEFECT, found while checking: folio-assistant-sci carries its config at 'folio-assistant-sci/folio-assistant-sci.config.json' — inside its own directory rather than at the root — so it also reads as not instantiated. Whether that is a misplaced file or a second legitimate location is a question for the owner, and fixing one without the other would leave the rule stated in two ways.



## Summary of Changes

who-iris.config.json at the repository root, making who-iris an instantiated
harness rather than a dependency.

A SIBLING SESSION DID THE SAME WORK IN PARALLEL. main created the same file
from the owner asking the same thing a different way ('why dont i see
who-iris as a harness on LHS on home navbar?'). The merge in 73237866 hit an
add/add conflict; the two files were semantically identical and main's was
taken, since it landed first and mine added nothing functional.

Three consequences the gates caught and nothing else would have: who-iris
owes a default board, _data/harness.json went stale, and a test used who-iris
as its example of a NON-instantiated dependency — main and I independently
fixed that the same way, by deriving the subject instead of naming it.

Marked completed 2026-09-21, late, for the same reason as t3n8.
