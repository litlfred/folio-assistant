---
# folio-assistant-kpci
title: who-iris gets its own CI for check:catalogue, iris:pages, iris:covers, dc:render; folio-assistant's index workflow stops calling them
status: in-progress
type: task
priority: high
created_at: 2026-10-11T07:00:59Z
updated_at: 2026-10-11T07:00:59Z
parent: folio-assistant-ml9h
---

Owner ruling 2026-10-11 ~06:55 UTC: **who-iris CI**. who-iris 7eda8c3 moved these from checkoutScripts to its own scripts (run from who-iris's root, with folio-assistant-core mounted inside it); who-iris has no workflow, and folio-assistant's code-quality-gates.yml 'registered, never run elsewhere' job calls them through 'bun run cat', which no longer finds them.

## Done when
- [ ] litlfred/who-iris has a workflow that mounts its dependencies and runs the four checks plus its tests
- [ ] the four 'bun run cat' lines leave folio-assistant's workflow (in #2529 or after it)
