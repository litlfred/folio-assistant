---
# folio-assistant-t3n8
title: 'HARNESS DISPLAY NAMES: every instance declares a human title, and the schema should say so'
status: todo
type: bug
priority: normal
created_at: 2026-09-21T17:28:40Z
updated_at: 2026-09-21T17:31:42Z
parent: folio-assistant-yj32
---

Owner, 2026-09-21: "harnesses should list the names (they should be named in schmeas, e.g. cat-boostrap should be named 'Boostrap', f-a => Folio Assistant, cat-harness => C@T Harness)"

CORPUS CHECK, from docs/_data/harness.json — every instance's title is currently just its directory name, with one exception that is wrong: cat-harness declares 'title: folio-assistant', which collides with the root instance and made disambiguate() (scripts/harness-tiles.ts:462) qualify it to 'folio-assistant (cat-harness)'. The disambiguator behaved correctly.

This SUPERSEDES bean 28jx, which proposed fixing cat-harness's title alone. The owner asks for the general rule: a display title per instance, declared. Two things to settle — whether title becomes REQUIRED in the declaration schema (a default of 'name' is what let the collision through unnoticed), and whether disambiguate() stays as a backstop once titles are distinct by construction.
