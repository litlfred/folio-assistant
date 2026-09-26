---
# folio-assistant-w9td
title: 'GETTING STARTED: kick off Pages on init and report the live URL'
status: completed
type: task
priority: normal
created_at: 2026-09-18T14:49:11Z
updated_at: 2026-09-18T14:49:11Z
---

## What

Instantiating a folio should immediately start the GitHub Pages render and hand
the user the URL **once it is confirmed live** — and say where it will be before
it is.

`scripts/pages-bootstrap.ts`: derive the Pages base URL from the git remote,
report whether the publish workflow exists, and optionally poll until the site
answers. Three states, per the house rule: live, not yet live, and could not
determine — the third is never rendered as either of the others.

## Done when

Script reports the URL for this repo, `--wait` has a bounded timeout, and
`getting-started.bpmn` has the task that calls it.

Issue: https://github.com/litlfred/folio-assistant/issues/232
