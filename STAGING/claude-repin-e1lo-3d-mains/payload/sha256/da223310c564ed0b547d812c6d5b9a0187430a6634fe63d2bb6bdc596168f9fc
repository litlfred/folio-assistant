---
# folio-assistant-kyrg
$schema: bean/1.0.0
title: 'HEALTH SWEEP cannot store its report: github-actions[bot] gets 403 on litlfred/cat-harness:cat/cat-harness/health'
status: in-progress
type: bug
priority: normal
created_at: 2026-10-22T13:25:43Z
updated_at: 2026-10-22T14:40:00Z
parent: folio-assistant-1xhc
---

`health-check.yml` now finishes: run 38 (39781213346, 2026-10-22) took 4.5 min, with the health checks themselves taking 29 s. It still ends red at "Write the report through its state branch":

```
cat-harness.health  litlfred/cat-harness:cat/cat-harness/health  failed
remote: Permission to litlfred/cat-harness.git denied to github-actions[bot]. … 403
```

The other three health graphs (cat-harness-tools, folio-assistant-core, who-iris) were unchanged, so nothing was pushed to them. They would hit the same wall the first time they change. The workflow's `GITHUB_TOKEN` can write only this repository. Each separated layer's health graph is a branch on **that layer's** repository, so the daily sweep cannot store a report anywhere but here.

It never showed before 2026-10-22 because no run reached the step (bean 1dre).

## Options (owner's call, since each one is about a credential or where the record lives)

1. A token or GitHub App installation with `contents: write` on the layer repositories, passed to the state push step. It would be declared in `credentials/needs.json`, which the `credentials` check already reports as missing.
2. Keep the folio-assistant sweep's reports in a folio-assistant-owned state branch, and let each layer's own CI write its own health graph.
3. Push only the graphs this repository owns, and report the others as "not written: no credential" rather than failing.

## Done when

- [x] the owner has chosen
- [ ] a daily `health-check.yml` run is green end to end, with the report stored where the choice says

## Owner ruling 2026-10-22

"kyrg option 2" (session_01JkK6uP3iU2etyMbrw7v3cu): this sweep's reports stay in folio-assistant, and each layer's own CI writes its own health graph. Claimed by claude/funny-keller-n85iva.
