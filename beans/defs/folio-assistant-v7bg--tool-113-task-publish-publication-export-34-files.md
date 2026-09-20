---
# folio-assistant-v7bg
title: 'TOOL 1/13: Task_Publish — publication & export (34 files, 19 entry points)'
status: todo
type: task
priority: high
created_at: 2026-09-20T04:34:11Z
updated_at: 2026-09-20T04:34:11Z
parent: folio-assistant-d308
---

Group 1 of 13 in `d308`. **34 files, 19 entry points** — the largest loose surface in the repo.

`kg-export`, `pages-bootstrap`, `gen-*-jsonld`, `gen-site-jsonld`, `site-links`,
`serve-rendering`, `strip-preview-seo`, `staging-*`, `readme-sections`,
`readme-links`, `gen-schema-docs`, `gen-skill-docs`, `harness-schema-export`.

**BPMN:** `authoring-a-paper · Task_Publish` and `authoring-a-document ·
Task_Publish`, both `serviceTask`, both already ref `content-publish`.

**Target repo (#223):** splits — the site half is `folio-assist-core`, `kg-export`
and `pages-bootstrap` are `agentic-harness`. That split is a finding, not a
problem: it is the one group whose files do not all go to one repo, so it is also
the one most likely to be two Tools rather than one.

## Done when
- [ ] a Tool node whose `invoke` names one entry point
- [ ] `satisfies` includes `content-publish`
- [ ] `selection` filled — `when` / `limits` / `cost`, per the schema `main` added
- [ ] `tool-coverage` no longer lists `content-publish` as uncovered
- [ ] the other 15 files in the group reachable only through it
