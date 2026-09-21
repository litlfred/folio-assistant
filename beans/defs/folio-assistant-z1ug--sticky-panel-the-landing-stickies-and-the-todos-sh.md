---
# folio-assistant-z1ug
title: 'STICKY PANEL: the landing stickies and the todos share one panel, minimised to a tile at start'
status: todo
type: bug
priority: high
created_at: 2026-09-21T17:11:37Z
updated_at: 2026-09-21T17:31:42Z
parent: folio-assistant-6lb8
---

Tracked as https://github.com/litlfred/folio-assistant/issues/756 items 1, 2 and 4.

Owner, 2026-09-21: "i dont want fa-sticky-board fa-landing-board to have inside it: fa-sticky fa-landing-sticky ... i want them in the sticky panel instead", "i thought the sticky panel had some todos, but they seem gone. they should be closed/tiled to start", "the todo panel should start minimized with an icon to open".

landing.html:74 renders the harness stickies as direct children of .fa-landing-board; mountTodoBoard (docs-ui.js:2775) appends its own board AFTER them, so the todos render past the end of a row of full-bleed cards and read as absent.
